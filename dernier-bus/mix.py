import json
import re
import subprocess
import wave
from pathlib import Path

import numpy as np

RATE = 48000
LENGTH = 45
script = json.loads(Path('script.json').read_text())
from timing import write_timeline
scene_times = write_timeline(script)
original_times = [0] + [x[0] for x in script[1:]] + [45]
voice_only = np.zeros(LENGTH * RATE, dtype=np.float32)
mix = np.zeros((LENGTH * RATE, 2), dtype=np.float32)
rng = np.random.default_rng(103)

def add(at, samples, gain, pan=0):
    start = round(at * RATE)
    count = min(len(samples), len(mix) - start)
    mix[start:start + count] += samples[:count, None] * np.array([1-pan, 1+pan]) * gain

def time_string(t):
    n = round(t * 100)
    return f"{n//360000}:{n//6000%60:02d}:{n//100%60:02d}.{n%100:02d}"

def event(start, end, style, words):
    return f'Dialogue: 0,{time_string(start)},{time_string(end)},{style},,0,0,0,,{words}\n'

ass = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes
WrapStyle: 2

[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Caption,DejaVu Sans,64,&H00FAF6EF,&H00FFFFFF,&H00121019,&H99000000,-1,0,0,0,100,100,0,0,1,5,3,2,90,90,365,1
Style: Title,DejaVu Sans,75,&H00FAF6EF,&H00FFFFFF,&H00121019,&H88000000,-1,0,0,0,100,100,3,0,1,5,3,8,90,90,180,1
Style: Clock,DejaVu Sans Mono,42,&H0076C5FF,&H00FFFFFF,&H00121019,&H88000000,-1,0,0,0,100,100,6,0,1,3,2,8,90,90,117,1

[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
"""
ass += event(.12,3.75,'Clock',r'{\fad(180,260)}03 H 00')
ass += event(.24,3.63,'Title',r'{\fad(200,280)}LE DERNIER BUS')

srt_cues = []
for i, (start, line) in enumerate(script):
    start = scene_times[i] + .15
    boundaries = [json.loads(s) for s in Path(f'audio/{i}.jsonl').read_text().splitlines()]
    tokens = re.findall(r"[\w’'-]+[.,!?…:]?", line.replace(' :', ':'))
    assert len(tokens) == len(boundaries), (i, tokens, boundaries)
    last = boundaries[-1]
    cut = (last['offset'] + last['duration']) / 1e7 + .105
    next_at = scene_times[i+1]
    tempo = max(1, cut / (next_at - start - .17))
    data = subprocess.check_output(['ffmpeg','-v','error','-i',f'audio/{i}.mp3','-af',
        f'atrim=end={cut},asetpts=PTS-STARTPTS,atempo={tempo},highpass=f=75,acompressor=threshold=0.12:ratio=2:attack=7:release=80',
        '-ar',str(RATE),'-ac','1','-f','f32le','-'])
    voice = np.frombuffer(data,dtype='<f4')
    add(start, voice, 1.27)
    offset = round(start * RATE)
    voice_only[offset:offset+len(voice)] += voice
    print(i, round(tempo,2), round(start+len(voice)/RATE,2))
    j=0
    while j<len(tokens):
        k=j
        while k+1<len(tokens) and k-j<2 and len(' '.join(tokens[j:k+2]))<=24 and not tokens[k].endswith(('.',':','!','?')):
            k+=1
        if k+2==len(tokens) and not tokens[k].endswith(('.',':','!','?')) and len(' '.join(tokens[j:]))<=25:
            k+=1
        begin=start+boundaries[j]['offset']/1e7/tempo
        end=start+(boundaries[k]['offset']+boundaries[k]['duration'])/1e7/tempo+.08
        if k+1<len(tokens):
            next_begin = start+boundaries[k+1]['offset']/1e7/tempo
            end = min(next_begin,end+.10)
            begin = max(begin,next_begin-.95) if k==j and end-begin>.95 else begin
        phrase=' '.join(tokens[j:k+1]).replace(':',' :')
        ass += event(begin, end, 'Caption', phrase)
        srt_cues.append((begin, end, phrase))
        j=k+1
Path('captions.ass').write_text(ass)

def clock(seconds):
    return np.arange(round(seconds*RATE)) / RATE

def band(seconds, low, high):
    t = clock(seconds)
    raw = np.fft.rfft(rng.normal(0,1,len(t)))
    f = np.fft.rfftfreq(len(t),1/RATE)
    raw *= (f >= low) & (f <= high)
    result = np.fft.irfft(raw,n=len(t))
    return result / (np.std(result)+1e-8)

def hiss(at, seconds, low, high, gain, pan=0):
    t=clock(seconds)
    shape=np.clip(t/.08,0,1)*np.clip((seconds-t)/.27,0,1)
    add(np.interp(at,original_times,scene_times),band(seconds,low,high)*shape,gain,pan)

def strike(at, freq, decay, gain, pan=0):
    t=clock(decay*5)
    wavelet=(np.sin(2*np.pi*freq*t)+.38*np.sin(2*np.pi*freq*2.07*t))*np.exp(-t/decay)
    add(np.interp(at,original_times,scene_times), wavelet*np.minimum(1,t/.007),gain,pan)

t=clock(45)
moving=np.clip((29.9-t)/4,0,1)
motor=np.sin(2*np.pi*47*t+.55*np.sin(t*1.7))+.36*np.sin(2*np.pi*94*t)
add(0,(motor*.72+band(45,38,135)*.30)*(.42+.58*moving),.045)
add(0,band(45,420,5000)*(.58+.16*np.sin(t*.87)),.019,-.27)
add(0,band(45,650,6100)*(.60+.13*np.sin(t*1.11)),.016,.35)
for at,f,d,g in [(0.12,48,.42,.105),(5.63,122,.13,.102),(8.35,61,.34,.17),(16.67,49,.34,.082),(19.18,43,.5,.10),(22.27,55,.27,.21),(32.34,47,.39,.18),(36.92,53,.51,.13),(44.38,48,.19,.076)]:
    strike(at,f,d,g)
for at in [7.98,8.11,8.26,22.24]:
    hiss(at,.16,900,5600,.097)
for at in [30.0,41.01]:
    hiss(at,.95,480,3300,.081,.37)
    strike(at+.18,105,.20,.076,.33)
    strike(at+.90,85,.13,.085,.30)
for at in [42.1,42.81,43.46,44.06]:
    strike(at,84,.083,.083,.30)
    hiss(at,.155,550,2500,.033,.28)
gain=np.minimum(np.minimum(t/.05,1),np.minimum((45-t)/.13,1))
mix=np.tanh(mix*gain[:,None]*1.05)
with wave.open('mix.wav','wb') as wav:
    wav.setparams((2,2,RATE,0,'NONE','not compressed'))
    wav.writeframes((mix*32767).astype('<i2').tobytes())

output = Path('../sortie')
output.mkdir(exist_ok=True)
subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(RATE),'-ac','1','-i','-','-af','loudnorm=I=-16:TP=-1.5:LRA=10','-ar','48000','-b:a','192k',str(output/'voix_off.mp3')],input=voice_only.tobytes(),check=True)

def srt_time(t):
    ms = round(t * 1000)
    return f"{ms//3600000:02d}:{ms//60000%60:02d}:{ms//1000%60:02d},{ms%1000:03d}"

with (output/'sous-titres.srt').open('w', encoding='utf-8') as subtitles:
    for index, (begin, end, phrase) in enumerate(srt_cues, 1):
        print(index, f'{srt_time(begin)} --> {srt_time(end)}', phrase, '', sep='\n', file=subtitles)
