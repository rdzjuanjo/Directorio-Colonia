# Manual de administrador — Panel de Colonia

Este panel te permite supervisar toda la operación: pedidos en tiempo real, negocios, repartidores, disputas, configuración de zona y reportes.

**URL:** `http://localhost:5173`
**Credenciales por defecto:** `admin@colonia.local` / `admin1234`

---

## Índice

1. [Dashboard](#1-dashboard)
2. [Pedidos](#2-pedidos)
3. [Negocios](#3-negocios)
4. [Repartidores](#4-repartidores)
5. [Disputas](#5-disputas)
6. [Analíticas](#6-analíticas)
7. [Bot catálogo](#7-bot-catálogo)
8. [Zona de entrega](#8-zona-de-entrega)

---

## 1. Dashboard

Vista general de la operación en tiempo real. Se actualiza automáticamente cada 15 segundos, no hace falta recargar la página.

### Qué muestra

| Tarjeta | Qué significa |
|---|---|
| **Pedidos hoy** | Total de pedidos creados en el día de hoy |
| **Pedidos activos** | Pedidos que están en proceso ahora mismo |
| **Repartidores disponibles** | Repartidores con estado "Disponible" |

Debajo de las tarjetas aparece la tabla de pedidos activos con: número de pedido, cliente, negocio, total, estado y hora de creación.

### Estados de pedidos

| Estado visible | Significado |
|---|---|
| Esperando pago | El cliente aún no ha transferido |
| Pago reportado | El cliente dice haber pagado, el negocio no confirmó |
| Confirmado | Pago verificado, negocio preparando |
| Preparando | El negocio está preparando el pedido |
| Modificado — pendiente | El negocio modificó ítems, el cliente debe confirmar |
| Listo | Pedido terminado, buscando repartidor |
| Repartidor asignado | Un repartidor va al negocio |
| En camino | Repartidor en camino al cliente |

---

## 2. Pedidos

Gestión completa de todos los pedidos con opción de cambiar estados manualmente y asignar repartidores.

### Filtrar pedidos

Usa el menú desplegable en la parte superior para ver solo pedidos en un estado específico (ej: solo "Pago reportado"). Por defecto muestra todos los pedidos activos.

### Gestionar un pedido

1. Haz clic en **"Gestionar"** en la fila del pedido.
2. El modal muestra el número de pedido y su estado actual.
3. Para cambiar el estado, haz clic en cualquiera de los botones de estado disponibles — el cambio es inmediato.
4. Si el pedido está en estado **"Listo"**, aparece una sección extra para asignar repartidor: se listan los repartidores disponibles y puedes hacer clic en uno para asignarlo.

> **Nota:** Cambiar el estado manualmente desde este panel envía las mismas notificaciones de WhatsApp que el flujo automático. Úsalo solo si algo se trabó.

---

## 3. Negocios

Alta, edición y administración de los negocios registrados en la plataforma.

### Ver la lista

Cada tarjeta muestra el nombre, categoría, CLABE y estado (Activo / Baneado).

### Agregar un nuevo negocio

1. Haz clic en **"+ Agregar"**.
2. Completa el formulario:

| Campo | Descripción |
|---|---|
| **Nombre del negocio** | Nombre comercial que verán los clientes |
| **Categoría** | Comida preparada, Abarrotes, Carnicería, Panadería, Farmacia o Miscelánea |
| **Descripción** | Texto breve opcional (ej: "Especialistas en pollos al carbón") |
| **Ubicación en el mapa** | Haz clic donde está el negocio, o arrastra el pin, o usa el botón GPS |
| **Ícono del negocio** | Selector visual — elige el que mejor represente al negocio |
| **CLABE** | 18 dígitos de la cuenta bancaria donde recibirán pagos |
| **Banco** | Nombre del banco (ej: BBVA, Banamex, Banorte) |
| **Titular de la cuenta** | Nombre completo del dueño de la cuenta |
| **WhatsApp del negocio** | Número en formato `521234567890@c.us` |
| **Email de acceso** | Con este email el negocio entra a su panel |
| **Contraseña inicial** | El negocio puede cambiarla desde su panel |

3. Haz clic en **"Guardar"**.

### Editar un negocio existente

Haz clic en **"Editar"** en la tarjeta del negocio. Se abre el mismo formulario con los datos actuales. Los campos de email y contraseña no aparecen al editar (el negocio gestiona eso desde su propio panel).

### Banear un negocio

Haz clic en **"Banear"** en la tarjeta. El negocio queda inactivo de inmediato — no aparecerá en el catálogo ni podrá recibir pedidos.

---

## 4. Repartidores

Alta, edición y seguimiento de los repartidores.

### Ver la lista

Cada tarjeta muestra el nombre, WhatsApp, estado actual y coordenadas GPS (si el repartidor las compartió recientemente).

| Estado | Color | Significado |
|---|---|---|
| Fuera de turno | Gris | No disponible para pedidos |
| Disponible | Verde | Listo para recibir asignaciones |
| Yendo al negocio | Amarillo | Fue asignado, va al negocio |
| En el negocio | Azul | Esperando que el negocio entregue el pedido |
| Entregando | Naranja | En camino al domicilio del cliente |

### Agregar un repartidor

1. Haz clic en **"+ Agregar"**.
2. Ingresa el **nombre** y el **WhatsApp ID** en formato `521234567890@c.us`.
3. Haz clic en **"Guardar"**.

El repartidor recibirá pedidos automáticamente desde ese número de WhatsApp.

### Banear un repartidor

Haz clic en **"Banear"** — el repartidor queda inactivo y no recibirá más asignaciones.

---

## 5. Disputas

Lista de conflictos reportados entre clientes, negocios o repartidores.

### Tipos de disputa

| Tipo | Qué pasó |
|---|---|
| Pago rechazado por negocio | El negocio dijo que no recibió el pago |
| Cliente dice pagar, negocio no confirma | El cliente reportó el pago pero el negocio no confirmó en tiempo |
| Reporte de cliente | El cliente abrió una queja |
| Reporte de negocio | El negocio abrió una queja |

### Resolver una disputa

Las disputas pendientes tienen **borde rojo**. Haz clic en **"✓ Resolver"** para marcarla como resuelta. Aparecerá con borde verde y opacidad reducida.

> La resolución solo cambia el estado en el sistema — la gestión del caso (reembolso, conversación con el cliente, etc.) se hace fuera del panel.

---

## 6. Analíticas

Reportes de ventas e ingresos de toda la plataforma.

### Seleccionar período

1. Cambia las fechas en los campos **"Desde"** y **"Hasta"**.
2. Haz clic en **"Aplicar"**.

Por defecto muestra los últimos 7 días.

### Qué muestra

**Tarjetas KPI:**
- **Pedidos entregados** — cuántos pedidos se completaron en el período
- **Ingresos totales** — suma de todos esos pedidos
- **Ticket promedio** — ingresos ÷ pedidos

**Gráficos:**
- Barras de pedidos por día — para ver en qué días hay más actividad
- Área de ingresos por día — tendencia económica

**Top 3 productos más vendidos** con medallas 🥇🥈🥉, unidades vendidas e ingresos por producto.

---

## 7. Bot catálogo

Analíticas de cómo los clientes interactúan con el directorio de negocios en WhatsApp.

### Qué mide

| Métrica | Qué significa |
|---|---|
| **Búsquedas** | Veces que alguien escribió algo en el bot |
| **Usuarios únicos** | Personas distintas que usaron el catálogo |
| **Negocios vistos** | Veces que alguien abrió el detalle de un negocio |
| **Contactos compartidos** | Veces que alguien hizo clic en "Contactar" |

También muestra:
- **Top negocios más consultados** — cuáles generan más interés
- **Búsquedas más frecuentes** — qué palabras escriben los clientes (útil para saber qué productos o negocios faltan)

---

## 8. Zona de entrega

Define el área geográfica donde se hacen entregas. Los pedidos fuera de la zona se ofrecen como retiro en tienda si el negocio lo permite, o se rechazan.

### Dibujar una zona nueva

1. Haz clic en **"Dibujar zona"** (o "Redibujar" si ya existe una).
2. El cursor cambia a una cruz — haz clic en el mapa para agregar puntos en el perímetro.
3. Si te equivocas, usa **"↩ Deshacer"** para quitar el último punto.
4. Con al menos 3 puntos, haz clic en **"✅ Cerrar polígono"**.
5. Verifica que el polígono azul cubre el área correcta.
6. Haz clic en **"💾 Guardar"**.

### Eliminar la zona

Haz clic en **"🗑️ Eliminar zona"** y luego en **"Guardar"**. Sin zona configurada, se aceptan pedidos de cualquier dirección.

> El polígono se guarda como coordenadas GPS — mientras más puntos uses, más preciso será el borde, pero 6-8 puntos suelen ser suficientes para una colonia.

---

## Configuración de la plataforma

Algunos parámetros del sistema se editan directamente en la base de datos o a través de la API (no hay pantalla dedicada aún):

| Parámetro | Valor por defecto | Qué controla |
|---|---|---|
| `delivery_fee` | $30 | Costo fijo de envío que se suma a cada pedido |
| `rider_accept_timeout_minutes` | 3 min | Tiempo que tiene un repartidor para aceptar antes de ofrecerlo al siguiente |
| `payment_timeout_minutes` | 30 min | Tiempo para que el cliente pague antes de cancelar automáticamente |
| `payment_confirm_timeout_minutes` | 30 min | Tiempo para que el negocio confirme el pago antes de alertar al admin |
| `preparation_timeout_minutes` | 90 min | Tiempo máximo de preparación antes de alertar al admin |
| `admin_whatsapp_id` | (vacío) | Número que recibe alertas del sistema por WhatsApp |
