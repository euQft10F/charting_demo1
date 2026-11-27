// The basic dist bundle (scatter and bar traces only) ships no types; it has the same API as the
// full plotly.js, which @types/plotly.js describes.
declare module 'plotly.js-basic-dist-min' {
  import * as Plotly from 'plotly.js'
  export default Plotly
}
