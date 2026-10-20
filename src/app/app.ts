import { Component, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  form,
  FormField,
  required,
  min,
  pattern,
} from '@angular/forms/signals';

interface DatosProducto {
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
  descripcion: string;
}

interface Producto extends DatosProducto {
  id: number;
}

function formularioVacio(): DatosProducto {
  return {
    nombre: '',
    categoria: '',
    precio: 0,
    stock: 0,
    descripcion: '',
  };
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormField, DecimalPipe],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  // Datos del formulario y lista de productos.
  modelo = signal<DatosProducto>(formularioVacio());
  productos = signal<Producto[]>([]);
  editandoId = signal<number | null>(null);
  mensaje = signal('');

  private siguienteId = 1;

  // Formulario Signal con validaciones.
  formulario = form(this.modelo, (campo) => {
    required(campo.nombre);
    pattern(campo.nombre, /\S/, {
      message: 'Escribe un nombre; no solo espacios.',
    });

    required(campo.categoria);

    required(campo.precio);
    min(campo.precio, 0.01);

    required(campo.stock);
    min(campo.stock, 0);

    required(campo.descripcion);
    pattern(campo.descripcion, /\S/, {
      message: 'Escribe una descripción; no solo espacios.',
    });
  });

  guardar(evento: Event): void {
    evento.preventDefault();

    const datos = this.modelo();

    if (
      this.formulario().invalid() ||
      !Number.isFinite(datos.precio) ||
      !Number.isInteger(datos.stock)
    ) {
      this.mensaje.set(
        'Completa los cinco campos. El precio debe ser mayor a cero y el stock un número entero no negativo.'
      );
      return;
    }

    const producto: DatosProducto = {
      ...datos,
      nombre: datos.nombre.trim(),
      descripcion: datos.descripcion.trim(),
    };

    const id = this.editandoId();

    if (id === null) {
      this.productos.update((lista) => [
        ...lista,
        { ...producto, id: this.siguienteId++ },
      ]);
      this.mensaje.set('Producto agregado correctamente.');
    } else {
      this.productos.update((lista) =>
        lista.map((item) =>
          item.id === id ? { ...producto, id } : item
        )
      );
      this.mensaje.set('Producto actualizado correctamente.');
    }

    this.limpiar();
  }

  editar(producto: Producto): void {
    const { id, ...datos } = producto;

    this.editandoId.set(id);
    this.formulario().reset({ ...datos });
    this.mensaje.set('Modifica los datos y guarda los cambios.');
  }

  eliminar(id: number): void {
    if (!window.confirm('¿Deseas eliminar este producto?')) {
      return;
    }

    this.productos.update((lista) =>
      lista.filter((producto) => producto.id !== id)
    );

    if (this.editandoId() === id) {
      this.limpiar();
    }

    this.mensaje.set('Producto eliminado.');
  }

  limpiar(): void {
    this.editandoId.set(null);
    this.formulario().reset(formularioVacio());
  }
}