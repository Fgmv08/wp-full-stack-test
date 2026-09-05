import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './presentation/redux/store'
import { HomePage } from './presentation/pages/HomePage'
import { PaymentResultPage } from './presentation/pages/PaymentResultPage'

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/payment-result" element={<PaymentResultPage />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  )
}

export default App
