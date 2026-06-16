import React from 'react';
import ReactDOMClient from 'react-dom/client';
import singleSpaReact from 'single-spa-react';
import { cssLifecycleFactory } from 'vite-plugin-single-spa/ex';
import App from './App';

const reactLifecycles = singleSpaReact({
  React,
  ReactDOMClient,
  rootComponent: App,
  domElementGetter: () => document.getElementById('diagram-app') as HTMLElement,
  errorBoundary(err: Error) {
    return <div style={{ padding: 16, color: '#a02c2c' }}>Ошибка диаграммы: {String(err)}</div>;
  },
});

const cssLc = cssLifecycleFactory('spa');

export const bootstrap = [cssLc.bootstrap, reactLifecycles.bootstrap];
export const mount = [cssLc.mount, reactLifecycles.mount];
export const unmount = [cssLc.unmount, reactLifecycles.unmount];
