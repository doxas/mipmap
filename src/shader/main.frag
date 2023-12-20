#version 300 es

precision highp float;
uniform sampler2D textureUnit;
uniform float textureBias;
in vec2 vTexCoord;
out vec4 color;

void main() {
  color = texture(textureUnit, vTexCoord, textureBias);
}
