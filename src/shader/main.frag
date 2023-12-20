precision highp float;
uniform vec2 mouse;
uniform vec2 resolution;
uniform sampler2D textureUnit;
varying vec2 vTexCoord;
void main() {
  vec4 color = texture2D(textureUnit, vTexCoord);
  gl_FragColor = color;
}
