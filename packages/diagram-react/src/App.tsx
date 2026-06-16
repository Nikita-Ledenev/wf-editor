import { Provider } from 'react-redux';
import Diagram from './components/Diagram';
import { store } from './store';

export default function App() {
  return (
    <Provider store={store}>
      <Diagram />
    </Provider>
  );
}
