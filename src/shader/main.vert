#version 300 es

in vec2 position;
uniform float geometryScale;
out vec2 vTexCoord;

void main() {
  vec2 coord = position * 0.5 + 0.5;
  vTexCoord = vec2(coord.x, 1.0 - coord.y);
  gl_Position = vec4(position * geometryScale, 0.0, 1.0);
}
