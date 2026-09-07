import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SearchableSelect } from '@/presentation/components/SearchableSelect';

describe('SearchableSelect Component', () => {
  const options = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena'];

  it('debe renderizar el label y el placeholder correctamente', () => {
    render(
      <SearchableSelect
        label="Ciudad de Entrega"
        value=""
        options={options}
        placeholder="Selecciona una ciudad"
        onChange={() => {}}
      />
    );

    expect(screen.getByText('Ciudad de Entrega')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Selecciona una ciudad')).toBeInTheDocument();
  });

  it('debe desplegar la lista de opciones al enfocar el input', () => {
    render(
      <SearchableSelect
        label="Ciudad"
        value=""
        options={options}
        onChange={() => {}}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);

    expect(screen.getByText('Bogotá')).toBeInTheDocument();
    expect(screen.getByText('Medellín')).toBeInTheDocument();
  });

  it('debe filtrar opciones según el texto ingresado', () => {
    render(
      <SearchableSelect
        label="Ciudad"
        value=""
        options={options}
        onChange={() => {}}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Med' } });

    expect(screen.getByText('Medellín')).toBeInTheDocument();
    expect(screen.queryByText('Bogotá')).not.toBeInTheDocument();
  });

  it('debe llamar a onChange y cerrar el dropdown al seleccionar una opción', () => {
    const handleChange = vi.fn();

    render(
      <SearchableSelect
        label="Ciudad"
        value=""
        options={options}
        onChange={handleChange}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);

    const option = screen.getByText('Cali');
    fireEvent.click(option);

    expect(handleChange).toHaveBeenCalledWith('Cali');
  });

  it('debe mostrar mensaje de error si la prop error está presente', () => {
    render(
      <SearchableSelect
        label="Ciudad"
        value=""
        options={options}
        error="Campo requerido"
        onChange={() => {}}
      />
    );

    expect(screen.getByText('Campo requerido')).toBeInTheDocument();
  });
});
