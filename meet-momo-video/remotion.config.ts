/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";

Config.setRspack(true);
// Flat cartoon colours stay cleanest when each frame is a PNG.
Config.setVideoImageFormat("png");
Config.setPixelFormat("yuv420p");
Config.setCodec("h264");
// The paper grain is costly to store; 24 keeps the file around 11 MB and still looks clean.
Config.setCrf(24);
Config.setOverwriteOutput(true);
