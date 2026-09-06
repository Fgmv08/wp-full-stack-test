import React, { useEffect, useRef } from 'react';

export interface WompiWidgetButtonProps {
  publicKey: string;
  currency: string;
  amountInCents: number;
  reference: string;
  signatureIntegrity: string;
  redirectUrl?: string;
  customerData?: {
    email?: string;
    fullName?: string;
    phoneNumber?: string;
    phoneNumberPrefix?: string;
    legalId?: string;
    legalIdType?: string;
  };
  shippingAddress?: {
    addressLine1?: string;
    addressLine2?: string;
    country?: string;
    city?: string;
    phoneNumber?: string;
    region?: string;
    name?: string;
    postalCode?: string;
  };
  className?: string;
}

/**
 * WompiWidgetButton
 * Integración oficial del Widget de Wompi mediante inyección dinámica del script
 * con data-attributes (<form><script src="https://checkout.wompi.co/widget.js" data-render="button" ...></script></form>)
 */
export const WompiWidgetButton: React.FC<WompiWidgetButtonProps> = ({
  publicKey,
  currency,
  amountInCents,
  reference,
  signatureIntegrity,
  redirectUrl,
  customerData,
  shippingAddress,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {

    console.log(publicKey)
    console.log(currency)
    console.log(amountInCents)
    console.log(reference)
    console.log(signatureIntegrity)
    console.log(redirectUrl)
    console.log(customerData)
    console.log(shippingAddress)
    console.log(className)
    const container = containerRef.current;
    if (!container) return;

    // Limpiar renderizado previo
    container.innerHTML = '';

    // Crear elemento <form>
    const form = document.createElement('form');
    form.className = 'w-full flex justify-center';

    // Las credenciales pub_stagtest pertenecen al entorno UAT/Staging
    const widgetUrl = publicKey.includes('stagtest') || publicKey.includes('uat')
      ? 'https://checkout.co.uat.wompi.dev/widget.js'
      : 'https://checkout.wompi.co/widget.js';

    // Crear etiqueta <script> oficial de Wompi con atributos requeridos
    const script = document.createElement('script');
    script.src = widgetUrl;
    script.setAttribute('data-render', 'button');
    script.setAttribute('data-public-key', publicKey);
    script.setAttribute('data-currency', currency);
    script.setAttribute('data-amount-in-cents', String(amountInCents));
    script.setAttribute('data-reference', reference);
    script.setAttribute('data-signature:integrity', signatureIntegrity);

    if (redirectUrl) {
      script.setAttribute('data-redirect-url', redirectUrl);
    }

    // Customer Data
    if (customerData?.email) {
      script.setAttribute('data-customer-data:email', customerData.email);
    }
    if (customerData?.fullName) {
      script.setAttribute('data-customer-data:full-name', customerData.fullName);
    }
    if (customerData?.phoneNumber) {
      script.setAttribute('data-customer-data:phone-number', customerData.phoneNumber);
    }
    if (customerData?.phoneNumberPrefix) {
      script.setAttribute('data-customer-data:phone-number-prefix', customerData.phoneNumberPrefix);
    }
    if (customerData?.legalId) {
      script.setAttribute('data-customer-data:legal-id', customerData.legalId);
    }
    if (customerData?.legalIdType) {
      script.setAttribute('data-customer-data:legal-id-type', customerData.legalIdType);
    }

    // Shipping Address
    if (shippingAddress?.addressLine1) {
      script.setAttribute('data-shipping-address:address-line-1', shippingAddress.addressLine1);
    }
    if (shippingAddress?.addressLine2) {
      script.setAttribute('data-shipping-address:address-line-2', shippingAddress.addressLine2);
    }
    if (shippingAddress?.country) {
      script.setAttribute('data-shipping-address:country', shippingAddress.country);
    }
    if (shippingAddress?.city) {
      script.setAttribute('data-shipping-address:city', shippingAddress.city);
    }
    if (shippingAddress?.phoneNumber) {
      script.setAttribute('data-shipping-address:phone-number', shippingAddress.phoneNumber);
    }
    if (shippingAddress?.region) {
      script.setAttribute('data-shipping-address:region', shippingAddress.region);
    }
    if (shippingAddress?.name) {
      script.setAttribute('data-shipping-address:name', shippingAddress.name);
    }

    form.appendChild(script);
    container.appendChild(form);

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [
    publicKey,
    currency,
    amountInCents,
    reference,
    signatureIntegrity,
    redirectUrl,
    customerData,
    shippingAddress,
  ]);

  return (
    <div className={`wompi-widget-container flex flex-col items-center justify-center p-4 ${className}`}>
      <div ref={containerRef} className="w-full flex justify-center min-h-[50px] items-center" />
    </div>
  );
};
