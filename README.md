# Armario Inteligente (MVP)

Aplicación web simple para:

1. Subir fotos de tus prendas.
2. Guardarlas en un repositorio local (en el navegador).
3. Detectar automáticamente un color dominante por imagen.
4. Combinar prendas por categorías para decidir qué ponerte en el día.
5. Ver una previsualización del conjunto y una puntuación básica de armonía de color.

## Cómo usar

No requiere backend ni instalación de dependencias.

```bash
python -m http.server 8000
```

Abre `http://localhost:8000`.

## Flujo

- **Añadir prenda**: seleccionas foto, nombre, categoría y temporada.
- **Repositorio de ropa**: ves todas las prendas guardadas con color detectado.
- **Combinar conjunto**: eliges una prenda por tipo (parte superior, inferior, etc.) o pulsas **Sugerir conjunto para hoy**.
- **Decisión**: revisas la previsualización y cambias piezas hasta que te guste.

## Limitaciones actuales

- El análisis de color es aproximado (promedio de píxeles).
- Los datos se guardan en `localStorage` del navegador (no en nube).
- No hay reconocimiento avanzado de tipo de prenda por IA en este MVP.
