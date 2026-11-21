import json
import subprocess
import sys
from fractions import Fraction
from pathlib import Path

video_path = Path(sys.argv[1])
info = json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',video_path]))
video, audio = info['streams']
assert (video['width'], video['height']) == (1080,1920)
assert Fraction(video['avg_frame_rate']) == 24
assert int(video['nb_frames']) == 1080
assert Fraction(info['format']['duration']) == 45
assert (video['codec_name'], video['pix_fmt'], audio['codec_name'], audio['channels']) == ('h264','yuv420p','aac',2)
assert video_path.stat().st_size < 100*1024**2
print('1080 × 1920, 24 i/s, 1080 images, 45 s, H.264 / AAC stéréo,', round(video_path.stat().st_size/1024**2,1), 'Mio')
