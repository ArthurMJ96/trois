import {
  Plane,
  Raycaster,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Three.js helper
 */
export default function useThree() {
  // default conf
  const conf = {
    canvas: null,
    antialias: true,
    alpha: false,
    orbit_ctrl: false,
    mouse_move: false,
    mouse_raycast: false,
    resize: 'window',
    width: 0,
    height: 0,
  };

  // size
  const size = {
    width: 0, height: 0,
    wWidth: 0, wHeight: 0,
    ratio: 0,
  };

  // handlers
  const afterInitHandlers = [];
  const afterResizeHandlers = [];
  const beforeRenderHandlers = [];

  // mouse tracking
  const mouse = new Vector2();
  const mouseV3 = new Vector3();
  const mousePlane = new Plane(new Vector3(0, 0, 1), 0);
  const raycaster = new Raycaster();

  // returned object
  const obj = {
    conf,
    renderer: null,
    camera: null,
    cameraCtrl: null,
    materials: {},
    scene: null,
    size,
    mouse, mouseV3,
    init,
    dispose,
    render,
    renderC,
    setSize,
    onAfterInit,
    onAfterResize,
    onBeforeRender,
  };

  /**
   * init three
   */
  function init(params) {
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        conf[key] = value;
      }
    }

    if (!obj.scene) {
      console.error('Missing Scene');
      return;
    }

    if (!obj.camera) {
      console.error('Missing Camera');
      return;
    }

    obj.renderer = new WebGLRenderer({ canvas: conf.canvas, antialias: conf.antialias, alpha: conf.alpha });

    if (conf.orbit_ctrl) {
      obj.orbitCtrl = new OrbitControls(obj.camera, obj.renderer.domElement);
      if (conf.orbit_ctrl instanceof Object) {
        for (const [key, value] of Object.entries(conf.orbit_ctrl)) {
          obj.orbitCtrl[key] = value;
        }
      }
    }

    if (conf.width && conf.height) {
      setSize(conf.width, conf.height);
    } else if (conf.resize) {
      onResize();
      window.addEventListener('resize', onResize);
    }

    if (conf.mouse_move) {
      if (conf.mouse_move === 'body') {
        obj.mouse_move_element = document.body;
      } else {
        obj.mouse_move_element = obj.renderer.domElement;
      }
      obj.mouse_move_element.addEventListener('mousemove', onMousemove);
      obj.mouse_move_element.addEventListener('mouseleave', onMouseleave);
    }

    afterInitHandlers.forEach(c => c());

    return true;
  };

  /**
   * add after init handler
   */
  function onAfterInit(callback) {
    afterInitHandlers.push(callback);
  }

  /**
   * add after resize handler
   */
  function onAfterResize(callback) {
    afterResizeHandlers.push(callback);
  }

  /**
   * add before render handler
   */
  function onBeforeRender(callback) {
    beforeRenderHandlers.push(callback);
  }

  /**
   * default render
   */
  function render() {
    if (obj.orbitCtrl) obj.orbitCtrl.update();
    beforeRenderHandlers.forEach(c => c());
    obj.renderer.render(obj.scene, obj.camera);
  }

  /**
   * composer render
   */
  function renderC() {
    if (obj.orbitCtrl) obj.orbitCtrl.update();
    beforeRenderHandlers.forEach(c => c());
    obj.composer.render();
  }

  /**
   * remove listeners
   */
  function dispose() {
    window.removeEventListener('resize', onResize);
    if (obj.mouse_move_element) {
      obj.mouse_move_element.removeEventListener('mousemove', onMousemove);
      obj.mouse_move_element.removeEventListener('mouseleave', onMouseleave); 
    }
  }

  /**
   * mousemove listener
   */
  function onMousemove(e) {
    mouse.x = (e.clientX / size.width) * 2 - 1;
    mouse.y = -(e.clientY / size.height) * 2 + 1;
    updateMouseV3();
  }

  /**
   * mouseleave listener
   */
  function onMouseleave(e) {
    mouse.x = 0;
    mouse.y = 0;
    updateMouseV3();
  }

  /**
   * get 3d mouse position
   */
  function updateMouseV3() {
    if (conf.mouse_raycast) {
      obj.camera.getWorldDirection(mousePlane.normal);
      mousePlane.normal.normalize();
      raycaster.setFromCamera(mouse, obj.camera);
      raycaster.ray.intersectPlane(mousePlane, mouseV3);
    }
  }

  /**
   * resize listener
   */
  function onResize() {
    if (conf.resize === 'window') {
      setSize(window.innerWidth, window.innerHeight);
    } else {
      setSize(conf.resize.clientWidth, conf.resize.clientHeight);
    }
    afterResizeHandlers.forEach(c => c());
  }

  /**
   * update renderer size and camera
   */
  function setSize(width, height) {
    size.width = width;
    size.height = height;
    size.ratio = width / height;

    obj.renderer.setSize(width, height, false);
    obj.camera.aspect = size.ratio;
    obj.camera.updateProjectionMatrix();

    if (obj.composer) {
      obj.composer.setSize(width, height);
    }

    const wsize = getCameraSize();
    size.wWidth = wsize[0]; size.wHeight = wsize[1];
  }

  /**
   * calculate camera visible area size
   */
  function getCameraSize() {
    const vFOV = (obj.camera.fov * Math.PI) / 180;
    const h = 2 * Math.tan(vFOV / 2) * Math.abs(obj.camera.position.z);
    const w = h * obj.camera.aspect;
    return [w, h];
  }

  return obj;
}
