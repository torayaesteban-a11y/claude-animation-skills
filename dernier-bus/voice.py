import json
import os
import re
import subprocess
from pathlib import Path
from urllib.request import urlretrieve

import numpy as np
from piper import PiperVoice, SynthesisConfig

audio = Path('audio')
audio.mkdir(exist_ok=True)
model = Path(os.environ.get('PIPER_MODEL', audio/'fr_FR-siwis-medium.onnx'))
source = 'https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx'
for suffix in ['', '.json']:
    if not Path(str(model)+suffix).exists():
        urlretrieve(source+suffix, str(model)+suffix)
voice = PiperVoice.load(str(model))
config = SynthesisConfig(length_scale=1.0, noise_scale=.55, noise_w_scale=.65)
for index, (_, line) in enumerate(json.loads(Path('script.json').read_text())):
    chunks, marks = [], []
    rate = voice.config.sample_rate
    cursor = 0
    for phrase in re.findall(r'[^.!?:]+[.!?:]?', line):
        words = phrase.split()
        words = [word for word in words if word.strip(' :')]
        pcm = np.concatenate([part.audio_int16_array for part in voice.synthesize(phrase.strip(), config)])
        weights = np.array([max(2,len(w)) for w in words])
        bounds = np.rint(np.r_[0, np.cumsum(weights)] / sum(weights) * len(pcm)).astype(int)
        for i, word in enumerate(words):
            marks.append(dict(text=word, offset=round((cursor+bounds[i])*1e7/rate), duration=round((bounds[i+1]-bounds[i])*1e7/rate)))
        pause = np.zeros(round(.22*rate), np.int16)
        chunks.extend([pcm,pause])
        cursor += len(pcm)+len(pause)
    subprocess.run(['ffmpeg','-v','error','-y','-f','s16le','-ar',str(rate),'-ac','1','-i','-','-b:a','192k',f'audio/{index}.mp3'], input=np.concatenate(chunks).tobytes(),check=True)
    (audio/f'{index}.jsonl').write_text('\n'.join(map(json.dumps,marks)))
