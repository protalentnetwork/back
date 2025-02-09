import { MercadoPagoConfig } from 'mercadopago';

if (!process.env.MP_ACCESS_TOKEN) {
    throw new Error('MP_ACCESS_TOKEN must be defined');
}

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN as string
});

export default client;