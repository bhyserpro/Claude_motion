"""
Тонкий клиент ElevenLabs. Ключ — только из переменной окружения ELEVENLABS_API_KEY:
он не печатается, не пишется в файлы и не попадает в тексты ошибок.

Перед первым запуском сверьте названия параметров с актуальной документацией (PEREGON_voice.md, §0) —
всё, что зависит от версии API, собрано здесь.
"""
import base64
import json
import os
import sys

import requests

API = 'https://api.elevenlabs.io'
SR = 44100  # частота файлов проекта
API_SR = 24000  # PCM 44,1 кГц — только с тарифа Pro; ниже берём 24 кГц и передискретизируем
OUTPUT = f'pcm_{API_SR}'
MODELS = ['eleven_v4', 'eleven_v3']  # первая доступная; у v3 нет request stitching


class ElevenError(RuntimeError):
    pass


def _key():
    k = os.environ.get('ELEVENLABS_API_KEY')
    if not k:
        sys.exit('нет ELEVENLABS_API_KEY в окружении')
    return k


def _req(method, path, *, json_body=None, params=None, files=None, data=None, timeout=180):
    r = requests.request(method, API + path, headers={'xi-api-key': _key()}, json=json_body, params=params,
                         files=files, data=data, timeout=timeout)
    if r.status_code >= 400:
        # тело ответа — без заголовков запроса, ключ туда не попадает
        raise ElevenError(f'{method} {path}: HTTP {r.status_code}: {r.text[:400]}')
    return r


def models():
    return _req('GET', '/v1/models').json()


def pick_model():
    ids = {m.get('model_id') for m in models()}
    for m in MODELS:
        if m in ids:
            return m
    raise ElevenError(f'нет ни одной из моделей {MODELS}')


def shared_voices(**filters):
    """Поиск в библиотеке голосов: language, gender, age, use_cases, search, page_size …"""
    params = {'language': 'ru', 'page_size': 30, **filters}
    return _req('GET', '/v1/shared-voices', params=params).json().get('voices', [])


def add_shared_voice(public_owner_id, voice_id, name):
    return _req('POST', f'/v1/voices/add/{public_owner_id}/{voice_id}', json_body={'new_name': name}).json()['voice_id']


def design(description, text, model):
    """Voice Design: превью-голоса. Возвращает [(generated_voice_id, pcm bytes)]."""
    r = _req('POST', '/v1/text-to-voice/design', params={'output_format': OUTPUT},
             json_body={'voice_description': description, 'text': text, 'model_id': model}).json()
    return [(p['generated_voice_id'], base64.b64decode(p['audio_base_64'])) for p in r.get('previews', [])]


def save_designed(generated_voice_id, name, description):
    return _req('POST', '/v1/text-to-voice', json_body={
        'voice_name': name, 'voice_description': description, 'generated_voice_id': generated_voice_id}).json()['voice_id']


def tts(voice_id, text, model, settings, *, seed=None, previous_text=None, next_text=None, previous_request_ids=None,
        language='ru'):
    """
    /with-timestamps: PCM + тайминг символов. Возвращает (pcm bytes, alignment, request_id).
    alignment = {'characters': [...], 'character_start_times_seconds': [...], 'character_end_times_seconds': [...]}
    """
    body = {'text': text, 'model_id': model, 'voice_settings': settings, 'language_code': language}
    if seed is not None:
        body['seed'] = seed
    if previous_text:
        body['previous_text'] = previous_text
    if next_text:
        body['next_text'] = next_text
    if previous_request_ids:
        body['previous_request_ids'] = previous_request_ids[-3:]
    r = _req('POST', f'/v1/text-to-speech/{voice_id}/with-timestamps', params={'output_format': OUTPUT}, json_body=body)
    j = r.json()
    return base64.b64decode(j['audio_base64']), j.get('alignment') or j.get('normalized_alignment'), r.headers.get('request-id')


def dialogue(inputs, model, *, seed=None):
    """Text to Dialogue: inputs = [{'text', 'voice_id'}]. Возвращает (pcm, сегменты говорящих или None)."""
    body = {'inputs': inputs, 'model_id': model}
    if seed is not None:
        body['seed'] = seed
    j = _req('POST', '/v1/text-to-dialogue/with-timestamps', params={'output_format': OUTPUT}, json_body=body).json()
    return base64.b64decode(j['audio_base64']), j.get('voice_segments')


def stt(wav_path, language='ru'):
    """Speech to Text (Scribe): текст."""
    with open(wav_path, 'rb') as f:
        j = _req('POST', '/v1/speech-to-text', files={'file': (os.path.basename(wav_path), f, 'audio/wav')},
                 data={'model_id': 'scribe_v1', 'language_code': language}).json()
    return j.get('text', '')


def audio_effects_catalog():
    return _req('GET', '/v1/audio-effects/catalog').json()


def pcm_to_float(pcm: bytes, sr=API_SR):
    """PCM 16 бит из API → float32 на частоте проекта SR."""
    import numpy as np
    from math import gcd
    x = np.frombuffer(pcm, dtype='<i2').astype('float32') / 32768.0
    if sr != SR:
        from scipy.signal import resample_poly
        g = gcd(SR, sr)
        x = resample_poly(x, SR // g, sr // g).astype('float32')
    return x


def float_to_pcm(x):
    """float на частоте SR → PCM 16 бит на частоте SR (для нарезки диалога)."""
    return (x * 32768).clip(-32768, 32767).astype('<i2').tobytes()


def delete_voice(voice_id):
    _req('DELETE', f'/v1/voices/{voice_id}')


def account_voices():
    return {v['voice_id']: v for v in _req('GET', '/v1/voices').json().get('voices', [])}


def usage():
    s = _req('GET', '/v1/user/subscription').json()
    return s['character_count'], s['character_limit']


def dump(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)
