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
  /**
   * Datos de tarjeta para pre-llenar el widget de Wompi.
   * Wompi los acepta como data-attributes opcionales.
   */
  cardData?: {
    number?: string;
    cvc?: string;
    expMonth?: string;
    expYear?: string;
    cardHolder?: string;
  };
  className?: string;
}

/**
 * WompiWidgetButton
 * Integración oficial del Widget de Wompi mediante inyección dinámica del script
 * con data-attributes (<form><script src="https://checkout.wompi.co/widget.js" data-render="button" ...></script></form>).
 *
 * Se restringe el pago a únicamente TARJETA DE CRÉDITO/DÉBITO mediante
 * data-payment-method-type="CARD".
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
  cardData,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Limpiar renderizado previo
    container.innerHTML = '';

    // Crear elemento <form>
    const form = document.createElement('form');
    form.className = 'w-full flex justify-center';

    // Las credenciales pub_stagtest pertenecen al entorno UAT/Staging
    const widgetUrl =
      publicKey.includes('stagtest') || publicKey.includes('uat')
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

    // ── Restringir a solo tarjeta ──────────────────────────────────────────
    // Wompi soporta: CARD, NEQUI, BANCOLOMBIA_TRANSFER, etc.
    // Al indicar CARD se ocultan todos los demás métodos de pago.
    script.setAttribute('data-payment-method-type', 'CARD');

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

    // ── Datos de tarjeta pre-llenados ─────────────────────────────────────
    // Wompi acepta data-card:* para pre-rellenar la tarjeta en el widget
    if (cardData?.number) {
      // Eliminar espacios antes de enviar al widget
      script.setAttribute('data-card:number', cardData.number.replace(/\s+/g, ''));
    }
    if (cardData?.cvc) {
      script.setAttribute('data-card:cvc', cardData.cvc);
    }
    if (cardData?.expMonth) {
      script.setAttribute('data-card:exp-month', cardData.expMonth);
    }
    if (cardData?.expYear) {
      // Wompi espera YYYY; si llega YY lo expandimos
      const year = cardData.expYear.length === 2 ? `20${cardData.expYear}` : cardData.expYear;
      script.setAttribute('data-card:exp-year', year);
    }
    if (cardData?.cardHolder) {
      script.setAttribute('data-card:card-holder', cardData.cardHolder);
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
    cardData,
  ]);

  return (
    <div className={`wompi-widget-container flex flex-col items-center justify-center p-4 ${className}`}>
      <div ref={containerRef} className="w-full flex justify-center min-h-[50px] items-center" />
    </div>
  );
};
