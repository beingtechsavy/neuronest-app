import { spawn } from 'node:child_process';
import process from 'node:process';
import path from 'node:path';

const root = process.cwd();
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
const inputVideo = path.join(root, 'neuronest-project-showcase-video.webm');
const narration = path.join(root, 'public', 'audio', 'neuronest-narration.mp3');
const music = path.join(root, 'public', 'sounds', 'coffee-shop.mp3');
const mp4 = path.join(root, 'neuronest-project-showcase.mp4');
const webm = path.join(root, 'neuronest-project-showcase.webm');

function run(args, label) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpeg, args, { stdio: 'inherit', windowsHide: true });
    child.on('error', reject);
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`${label} failed with exit code ${code}`)));
  });
}

const audioFilter = '[1:a]aformat=channel_layouts=stereo,volume=1.8[narration];[2:a]aformat=channel_layouts=stereo,volume=0.2[music];[narration][music]amix=inputs=2:duration=longest:dropout_transition=2:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11,apad[audio]';
// Chrome's canvas WebM can carry a 1kHz timebase even though it contains
// roughly 30 frames per second. Force the real capture rate here; otherwise
// FFmpeg interprets the source as 1000fps and duplicates tens of thousands of
// frames, producing visibly laggy playback.
const common = ['-y', '-r', '30', '-i', inputVideo, '-i', narration, '-stream_loop', '-1', '-i', music, '-filter_complex', audioFilter, '-map', '0:v:0', '-map', '[audio]', '-t', '55'];

await run([
  ...common,
  '-r', '30', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-ar', '48000', '-b:a', '192k', '-movflags', '+faststart', mp4,
], 'MP4 mix');

await run([
  ...common,
  '-r', '30', '-c:v', 'libvpx-vp9', '-crf', '32', '-b:v', '0',
  '-c:a', 'libopus', '-ar', '48000', '-b:a', '128k', webm,
], 'WebM mix');

console.log(`Wrote ${path.relative(root, mp4)}`);
console.log(`Wrote ${path.relative(root, webm)}`);
