import { NodeIO } from '@gltf-transform/core';
import { EXTMeshoptCompression, ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { reorder } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';
import { readdir, copyFile, mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { createHash } from 'node:crypto';
await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const hash = data => createHash('sha256').update(data).digest('hex');
for (const name of ['ne-zha','taisui','anime']) {
 const input=`public/assets/${name}.glb`, backup=`design/performance-originals/${name}.glb`, output=`public/assets/${name}-optimized.glb`;
 if (existsSync(input)) await copyFile(input,backup);
 if (!existsSync(backup)) throw Error(`Original model required: ${input}`);
 const document=await io.read(backup);
 const triangles=document.getRoot().listMeshes().flatMap(m=>m.listPrimitives()).map(p=>p.getIndices()?.getCount());
 await document.transform(reorder({encoder:MeshoptEncoder,target:'size'}));
 const fingerprint=doc=>({attributes:doc.getRoot().listMeshes().flatMap(m=>m.listPrimitives()).map(p=>p.listSemantics().sort().map(key=>{const a=p.getAttribute(key);return [key,hash(Buffer.from(a.getArray().buffer,a.getArray().byteOffset,a.getArray().byteLength))];})),textures:doc.getRoot().listTextures().map(t=>hash(t.getImage())).sort()});
 const before=fingerprint(document);
 document.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.QUANTIZE});
 await io.write(output,document);
 const decoded=await io.read(output);
 if(JSON.stringify(before)!==JSON.stringify(fingerprint(decoded)))throw Error(`Roundtrip mismatch: ${name}`);
 if(JSON.stringify(triangles)!==JSON.stringify(decoded.getRoot().listMeshes().flatMap(m=>m.listPrimitives()).map(p=>p.getIndices()?.getCount())))throw Error('Topology count changed');
 console.log(name, (await stat(backup)).size, '->', (await stat(output)).size, 'verified exact decoded attributes and textures');
}
async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const path=join(dir,entry.name);if(entry.isDirectory())await walk(path);else if(path.endsWith('.png')){const backup=join('design/performance-originals',relative('public/assets',path));await mkdir(dirname(backup),{recursive:true});await copyFile(path,backup);const output=path.replace(/\.png$/,'.webp');await sharp(path).webp({quality:85,alphaQuality:100,effort:6}).toFile(output);console.log(path,(await stat(path)).size,'->',(await stat(output)).size);}}}
await walk('public/assets');
