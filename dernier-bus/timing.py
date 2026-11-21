import json
from pathlib import Path

def write_timeline(script):
    anchors = [0] + [start for start, _ in script[1:]] + [45]
    lengths = []
    for index in range(len(script)):
        marks = [json.loads(line) for line in Path(f'audio/{index}.jsonl').read_text().splitlines()]
        last = marks[-1]
        lengths.append((last['offset'] + last['duration']) / 1e7 + .48)
    scale = 45 / sum(lengths)
    times = [0]
    for length in lengths:
        times.append(times[-1] + length * scale)
    times[-1] = 45
    Path('timeline.json').write_text(json.dumps(list(zip(anchors, times))))
    return times
