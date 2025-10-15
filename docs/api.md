# Documentación de Endpoints

## Indicadores por Producto

- **Método**: `GET`
- **Ruta**: `/indicadores/producto`
- **Descripción**: retorna indicadores de cumplimiento de plan, calidad y NPT para un producto específico, incluyendo opción de comparación contra otro periodo y metas configurables.

### Parámetros de consulta

| Parámetro | Obligatorio | Descripción |
|-----------|-------------|-------------|
| `productoId` / `producto` | Sí (al menos uno) | Identificador del producto según `orden_produccion.producto`. |
| `periodo` | No | Ventana actual (`diario`, `semanal`, `mensual`). Por defecto: día actual. |
| `inicio`, `fin` | No | Fechas ISO para delimitar el periodo actual (si se envían, se ignora `periodo`). |
| `compararCon` | No | Periodo de referencia: `previo` (default), `mismoPeriodoAnterior`, `personalizado`, `ninguno`. |
| `compararInicio`, `compararFin` | No | Fechas ISO para comparación personalizada. |
| `targetNc` | No | Objetivo de % de piezas no conformes. |
| `targetNpt` | No | Objetivo de NPT en horas. |
| `targetCumplimiento` | No | Objetivo de cumplimiento (relación 0-1). |

### Ejemplo de uso

```
GET /indicadores/producto?productoId=PROD-123&periodo=mensual&compararCon=previo&targetNc=2.5&targetNpt=8&targetCumplimiento=0.92
```

### Ejemplo de respuesta

```json
{
  "producto": "PROD-123",
  "periodo": {
    "inicio": "2025-01-01T00:00:00-05:00",
    "fin": "2025-01-31T23:59:59.999-05:00"
  },
  "comparativo": {
    "inicio": "2024-12-01T00:00:00-05:00",
    "fin": "2024-12-31T23:59:59.999-05:00",
    "tipo": "previo"
  },
  "indicadores": [
    {
      "indicador": "cumplimiento_plan",
      "periodo_actual": {
        "inicio": "2025-01-01T00:00:00-05:00",
        "fin": "2025-01-31T23:59:59.999-05:00"
      },
      "valor_actual": {
        "piezas_planeadas": 1200,
        "piezas_producidas": 1104,
        "cumplimiento_rel": 0.92,
        "cumplimiento_pct": 92
      },
      "comparativo": {
        "inicio": "2024-12-01T00:00:00-05:00",
        "fin": "2024-12-31T23:59:59.999-05:00",
        "piezas_planeadas": 1180,
        "piezas_producidas": 990,
        "cumplimiento_rel": 0.84,
        "cumplimiento_pct": 84
      },
      "variacion_pct": 9.52,
      "objetivo": 0.92,
      "objetivo_pct": 92,
      "brecha_objetivo": 0,
      "brecha_objetivo_pct": 0
    },
    {
      "indicador": "calidad_no_conforme",
      "periodo_actual": {
        "inicio": "2025-01-01T00:00:00-05:00",
        "fin": "2025-01-31T23:59:59.999-05:00"
      },
      "valor_actual": {
        "piezas_totales": 1135,
        "piezas_no_conformes": 31,
        "porcentaje_no_conformes": 2.73
      },
      "comparativo": {
        "inicio": "2024-12-01T00:00:00-05:00",
        "fin": "2024-12-31T23:59:59.999-05:00",
        "piezas_totales": 1016,
        "piezas_no_conformes": 45,
        "porcentaje_no_conformes": 4.43
      },
      "variacion_pct": -38.37,
      "objetivo": 2.5,
      "brecha_objetivo": 0.23
    },
    {
      "indicador": "npt",
      "periodo_actual": {
        "inicio": "2025-01-01T00:00:00-05:00",
        "fin": "2025-01-31T23:59:59.999-05:00"
      },
      "valor_actual": {
        "total_minutos": 430,
        "total_horas": 7.17,
        "npt_por_inactividad_min": 310,
        "pasos": [
          {
            "pasoId": "PASO-A",
            "nombre": "Preparación",
            "minutos": 190,
            "horas": 3.17,
            "porcentaje": 44.19,
            "nptPorInactividadMin": 120
          },
          {
            "pasoId": "PASO-B",
            "nombre": "Ensamble",
            "minutos": 160,
            "horas": 2.67,
            "porcentaje": 37.21,
            "nptPorInactividadMin": 130
          },
          {
            "pasoId": "PASO-C",
            "nombre": "Embalaje",
            "minutos": 80,
            "horas": 1.33,
            "porcentaje": 18.6,
            "nptPorInactividadMin": 60
          }
        ]
      },
      "comparativo": {
        "inicio": "2024-12-01T00:00:00-05:00",
        "fin": "2024-12-31T23:59:59.999-05:00",
        "total_minutos": 510,
        "total_horas": 8.5,
        "npt_por_inactividad_min": 370,
        "pasos": [
          {
            "pasoId": "PASO-A",
            "nombre": "Preparación",
            "minutos": 200,
            "horas": 3.33,
            "porcentaje": 39.22,
            "nptPorInactividadMin": 150
          },
          {
            "pasoId": "PASO-B",
            "nombre": "Ensamble",
            "minutos": 190,
            "horas": 3.17,
            "porcentaje": 37.25,
            "nptPorInactividadMin": 150
          },
          {
            "pasoId": "PASO-C",
            "nombre": "Embalaje",
            "minutos": 120,
            "horas": 2,
            "porcentaje": 23.53,
            "nptPorInactividadMin": 70
          }
        ]
      },
      "variacion_pct": -15.65,
      "objetivo": 8,
      "unidad_objetivo": "horas",
      "brecha_objetivo": -0.83
    }
  ],
  "metadatos": {
    "zonaHoraria": "America/Bogota",
    "minutosInactividadParaNPT": 3
  }
}
```
