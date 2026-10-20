# andressolo18-interfaz-de-Airbnb

## Google Maps

Configura estas variables en `.env.local` y reinicia `npm run dev`:

```dotenv
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_clave
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=tu_map_id
```

La clave requiere Maps JavaScript API habilitada y una cuenta con facturacion activa.
Restringela por API y por referentes HTTP autorizados (localhost y el dominio de despliegue).
Las variables `NEXT_PUBLIC_*` son publicas en el navegador: no uses una clave sin restricciones.
El Map ID es opcional durante el desarrollo, donde se usa `DEMO_MAP_ID`; configura uno propio para produccion.

El mapa muestra los alojamientos filtrados y permite abrir su detalle al pulsar un pin.
Las coordenadas del catalogo son de demostracion, distribuidas cerca del centro de cada ciudad;
deben sustituirse por ubicaciones verificadas para alojamientos reales.