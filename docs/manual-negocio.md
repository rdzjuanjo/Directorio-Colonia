# Manual del negocio — Panel de gestión

Este panel te permite gestionar tu negocio en la plataforma: confirmar pagos, preparar y marcar pedidos como listos, administrar tu menú, configurar horarios y ver tus ingresos.

**URL:** `http://localhost:5174`
**Usuario y contraseña:** te los proporciona el administrador de la plataforma.

---

## Índice

1. [Acceso y recuperación de contraseña](#1-acceso-y-recuperación-de-contraseña)
2. [Pedidos activos](#2-pedidos-activos)
3. [Menú](#3-menú)
4. [Horarios de atención](#4-horarios-de-atención)
5. [Historial](#5-historial)
6. [Analíticas](#6-analíticas)

---

## 1. Acceso y recuperación de contraseña

### Iniciar sesión

1. Abre el panel en tu navegador.
2. Ingresa tu **correo electrónico** y **contraseña**.
3. Haz clic en **"Ingresar"**.

### ¿Olvidaste tu contraseña?

1. En la pantalla de login, haz clic en **"¿Olvidaste tu contraseña?"**.
2. Escribe tu correo registrado y haz clic en **"Enviar código"**.
3. Recibirás un código de 6 dígitos **por WhatsApp** en el número asociado a tu negocio.
4. Ingresa el código y tu nueva contraseña (mínimo 6 caracteres).
5. Haz clic en **"Cambiar contraseña"** e inicia sesión normalmente.

> El código expira en 15 minutos. Si no lo recibes, verifica que el WhatsApp de tu negocio esté activo o contacta al administrador.

---

## 2. Pedidos activos

Esta es la pantalla principal de operación. Muestra todos los pedidos que requieren tu atención ahora mismo. **Se actualiza automáticamente cada 15 segundos**, no necesitas recargar la página.

### Cómo leer la lista

Cada pedido muestra:
- **Número de pedido** (#ID)
- **Hora** en que se creó
- **Total** del pedido
- **Estado actual** (etiqueta amarilla)

Si no hay pedidos activos, verás el mensaje: *"No hay pedidos activos ahora."*

### Abrir el detalle de un pedido

Haz clic en **"Ver"** para abrir el panel de detalles. Ahí verás:
- El desglose completo de productos, cantidades y precios
- La dirección de entrega o indicación de retiro en tienda
- Los botones de acción disponibles según el estado

---

### Flujo normal de un pedido

#### Paso 1 — Llega un pedido nuevo

El bot de WhatsApp te notificará cuando un cliente realice un pedido. También aparecerá en la lista con estado **"Pago enviado"** cuando el cliente reporte que ya pagó.

#### Paso 2 — Confirmar el pago

1. Abre el pedido haciendo clic en **"Ver"**.
2. Verifica en tu cuenta bancaria que recibiste la transferencia por el monto exacto indicado.
3. Si el pago llegó, haz clic en **"✅ Confirmar pago"**.
4. El cliente recibe una notificación automática por WhatsApp.

> Si el pago **no llegó**, no confirmes. El sistema alertará al administrador si pasa mucho tiempo sin confirmación.

#### Paso 3 — Preparar el pedido

Una vez confirmado el pago, el pedido pasa a estado **"Preparando"**. Prepara el pedido normalmente.

#### Paso 4 — Marcar como listo

Cuando el pedido esté listo para entregar:

1. Abre el pedido y haz clic en **"📦 Marcar como listo"**.
2. Si es **entrega a domicilio**: el sistema busca un repartidor automáticamente.
3. Si es **retiro en tienda**: el cliente recibe un mensaje para que venga a recoger.

---

### Modificar un pedido

Si un producto se terminó o necesitas cambiar algo antes de preparar:

1. Abre el pedido en estado "Pago enviado" o "Preparando".
2. Haz clic en **"✏️ Modificar pedido"**.
3. En el modal puedes:
   - Cambiar la cantidad de cualquier ítem (escribe el número nuevo)
   - Eliminar un ítem haciendo clic en **✕**
4. Haz clic en **"Enviar modificación"**.
5. El cliente recibe un mensaje por WhatsApp con los cambios y debe confirmar antes de que sigas preparando.

> Solo puedes modificar pedidos que estén en "Pago enviado" o "Preparando".

---

### Tabla de estados

| Estado | Qué significa | Qué debes hacer |
|---|---|---|
| Esperando pago | El cliente aún no ha pagado | Esperar |
| Pago enviado | El cliente dice haber pagado | Verificar y confirmar |
| Confirmado | Pago verificado | Empezar a preparar |
| Preparando | En proceso de preparación | Preparar el pedido |
| Modificado — esperando cliente | Mandaste cambios al cliente | Esperar su confirmación |
| Listo | Pedido terminado | Esperar al repartidor o cliente |

---

## 3. Menú

Administra las categorías y productos que los clientes ven al ordenar.

### Agregar una categoría

1. Escribe el nombre de la categoría en el campo **"Nueva categoría"** (ej: *Pizzas*, *Bebidas*, *Postres*).
2. Haz clic en **"+ Categoría"**.

### Eliminar una categoría

Haz clic en **"Eliminar"** junto al nombre de la categoría.

> ⚠️ Eliminar una categoría borra también **todos los productos** que contiene. Esta acción no se puede deshacer.

### Agregar un producto

1. Dentro de la categoría correspondiente, haz clic en **"+ Producto"**.
2. Completa el formulario:

| Campo | Descripción |
|---|---|
| **Nombre** | Nombre del producto que verá el cliente (ej: *Pizza Margarita*) |
| **Descripción** | Ingredientes o detalles adicionales (opcional, pero recomendado) |
| **Precio** | Precio unitario en pesos |

3. Haz clic en **"Guardar"**.

### Agregar foto a un producto

Las fotos ayudan a los clientes a decidir y aumentan las ventas.

1. Localiza el producto en la lista.
2. Haz clic en **"📷 Foto"**.
3. Selecciona una imagen de tu dispositivo (JPG o PNG).
4. La foto se sube automáticamente — no necesitas guardar nada más.

### Marcar un producto como agotado

Haz clic en el toggle verde **"Disponible"** del producto. Cambia a gris **"Agotado"** y el producto deja de aparecer en el menú de los clientes hasta que lo actives de nuevo.

### Editar o eliminar un producto

- **Editar:** Haz clic en **"Editar"** — puedes cambiar nombre, descripción y precio.
- **Eliminar:** Haz clic en **"✕"** junto al producto. Esta acción no se puede deshacer.

---

## 4. Horarios de atención

Define en qué días y horarios tu negocio acepta pedidos. Fuera de tu horario, los clientes verán que estás cerrado.

### Configurar el horario

1. Activa el **checkbox** de cada día que atiendas.
2. Para cada día activo, establece la **hora de apertura** y **hora de cierre** en formato 24h.
3. Haz clic en **"Guardar horarios"** — el botón mostrará "✅ Guardado" por un momento.

### Ejemplo de horario típico

| Día | Estado | Apertura | Cierre |
|---|---|---|---|
| Lunes | Abierto | 10:00 | 21:00 |
| Martes | Abierto | 10:00 | 21:00 |
| Miércoles | Abierto | 10:00 | 21:00 |
| Jueves | Abierto | 10:00 | 21:00 |
| Viernes | Abierto | 10:00 | 22:00 |
| Sábado | Abierto | 10:00 | 22:00 |
| Domingo | Cerrado | — | — |

### Cerrar el negocio temporalmente

Si necesitas cerrar un día que normalmente estarías abierto (festivo, mantenimiento, etc.):

1. Desactiva el checkbox del día correspondiente.
2. Guarda.
3. Cuando retomes operaciones, vuelve a activar el día y guarda.

---

## 5. Historial

Lista de todos los pedidos finalizados (entregados, cancelados y disputados).

### Qué muestra

- **Total entregado** — suma de todos los pedidos completados exitosamente (en verde)
- Tabla con número de pedido, total, estado y fecha

### Estados en el historial

| Estado | Color | Significado |
|---|---|---|
| Entregado | Verde | Pedido completado — generó ingresos |
| Cancelado | Gris | Pedido cancelado — sin ingresos |
| Disputa | Rojo | Existe una reclamación — el administrador la gestiona |

El historial es solo de consulta, no se puede modificar.

---

## 6. Analíticas

Reportes de desempeño de tu negocio para el período que elijas.

### Seleccionar período

1. Cambia las fechas en los campos **"Desde"** y **"Hasta"**.
2. Haz clic en **"Aplicar"**.

Por defecto muestra los últimos 7 días.

### Qué muestra

**Tarjetas de resumen:**

| Indicador | Qué significa |
|---|---|
| **Pedidos entregados** | Cuántos pedidos completaste en el período |
| **Ingresos totales** | Dinero generado (solo pedidos entregados) |
| **Ticket promedio** | Ingresos ÷ pedidos — cuánto gana tu negocio por pedido en promedio |

**Gráficos:**
- **Pedidos por día** — barras que muestran en qué días tuviste más actividad
- **Ingresos por día** — tendencia de cuánto ganaste cada día

**Top 3 productos más vendidos** con medallas 🥇🥈🥉 — te ayuda a saber qué productos son los favoritos de tus clientes.

### Usos comunes

**Ver mis ventas del mes:**
Selecciona desde el día 1 del mes hasta hoy → "Aplicar".

**Saber cuál fue mi mejor día:**
Mira el gráfico de barras "Pedidos por día" — la barra más alta es tu mejor día.

**Decidir qué productos promocionar:**
Revisa el top 3 — los más vendidos son tus favoritos. Considera tener siempre stock de ellos.

---

## Preguntas frecuentes

**¿Qué hago si un cliente dice haber pagado pero no veo el dinero?**
No confirmes el pago. Espera a que el dinero llegue a tu cuenta. Si el cliente insiste, contacta al administrador de la plataforma para que revise.

**¿Puedo cancelar un pedido desde el panel?**
No directamente. Contacta al administrador para que lo cancele desde el panel de administración.

**¿Cómo sabe el sistema que estoy abierto?**
Revisa tu horario configurado en la sección "Horarios de atención". Si el horario dice que estás cerrado, los clientes no podrán ordenar aunque tú estés disponible.

**Un producto se me acabó de repente, ¿qué hago?**
Ve a Menú, encuentra el producto y haz clic en el toggle "Disponible" para marcarlo como "Agotado". Los clientes ya no podrán pedirlo hasta que lo vuelvas a activar.

**¿Puedo cambiar mi contraseña?**
Sí. En la pantalla de login, usa la opción "¿Olvidaste tu contraseña?". Recibirás un código por WhatsApp para restablecerla.
