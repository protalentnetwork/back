import React from 'react';

export default function PaymentForm() {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const text = formData.get('text') as string;
    
    const response = await fetch('/api/payments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    
    const { checkoutUrl } = await response.json();
    window.location.href = checkoutUrl;
  };

  return (
    <section className="grid gap-8">
      <form onSubmit={handleSubmit} className="grid gap-2">
        <textarea
          className="border-2 border-blue-400 p-2"
          name="text"
          placeholder="Hola perro"
          rows={3}
        />
        <button className="rounded bg-blue-400 p-2" type="submit">
          Enviar
        </button>
      </form>
    </section>
  );
}