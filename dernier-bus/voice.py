import asyncio
import json
import os
import ssl
from pathlib import Path

import edge_tts

VOICE = 'fr-FR-RemyMultilingualNeural'


async def main():
    # Trust the machine's CA bundle when the network uses a TLS proxy.
    edge_tts.communicate._SSL_CTX = ssl.create_default_context()
    Path('audio').mkdir(exist_ok=True)
    script = json.loads(Path('script.json').read_text())
    for index, (_, line) in enumerate(script):
        speech = edge_tts.Communicate(
            line, VOICE, rate='-2%', pitch='-3Hz', boundary='WordBoundary',
            proxy=os.environ.get('HTTPS_PROXY'),
        )
        await speech.save(f'audio/{index}.mp3', f'audio/{index}.jsonl')


asyncio.run(main())
