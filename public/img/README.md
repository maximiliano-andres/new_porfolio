# Guía Profesional: Concurrencia, Seguridad Temporal y Anti-Patrones de Acceso a Datos

> Referencia técnica exhaustiva para backend empresarial (Java, Python, Node.js) y bases de datos SQL/NoSQL.

---

## Índice

**Parte 1 — Concurrencia, Memoria y Seguridad Temporal**
1. [TOCTOU](#1-toctou-time-of-check-to-time-of-use)
2. [Race Condition](#2-race-condition)
3. [Data Race](#3-data-race)
4. [Deadlock](#4-deadlock)
5. [Livelock](#5-livelock)
6. [Starvation](#6-starvation)
7. [Priority Inversion](#7-priority-inversion)
8. [ABA Problem](#8-aba-problem)
9. [Use-After-Free](#9-use-after-free-uaf)
10. [Double-Free](#10-double-free)
11. [Dangling Pointer](#11-dangling-pointer)
12. [Memory Leak](#12-memory-leak)
13. [Buffer Overflow](#13-buffer-overflow)
14. [Atomicity Violation](#14-atomicity-violation)
15. [Order Violation](#15-order-violation)
16. [Lost Update](#16-lost-update)
17. [Dirty Read](#17-dirty-read)
18. [Non-Repeatable Read](#18-non-repeatable-read)
19. [Phantom Read](#19-phantom-read)
20. [Write Skew](#20-write-skew)
21. [Confused Deputy Problem](#21-confused-deputy-problem)
22. [Lock Convoy](#22-lock-convoy)
23. [Thundering Herd](#23-thundering-herd)
24. [Split-Brain](#24-split-brain)
25. [Distributed Race Condition](#25-distributed-race-condition)
26. [Idempotency Violation](#26-idempotency-violation)

**Parte 2 — Anti-Patrones de Acceso a Datos y Rendimiento**
27. [N+1 Query Problem](#27-n1-query-problem)
28. [Cartesian Product Explosion](#28-cartesian-product-explosion)
29. [SELECT N+1 en Serialización](#29-select-n1-en-serialización-api)
30. [Over-fetching](#30-over-fetching)
31. [Under-fetching](#31-under-fetching)
32. [Chatty API / Chatty I/O](#32-chatty-api--chatty-io)
33. [Missing Index / Full Table Scan](#33-missing-index--full-table-scan)
34. [Implicit Type Conversion](#34-implicit-type-conversion-index-bypass)
35. [Cartesian Join (SQL puro)](#35-cartesian-join-sql-puro)
36. [Connection Pool Exhaustion](#36-connection-pool-exhaustion)
37. [Lazy Initialization Exception](#37-lazy-initialization-exception)
38. [Slow Query / Query Plan Regression](#38-slow-query--query-plan-regression)
39. [Cache Stampede](#39-cache-stampede)
40. [Hot Partition / Hot Key](#40-hot-partition--hot-key)
41. [Pagination Offset Problem](#41-pagination-offset-problem)
42. [Unbounded Result Set](#42-unbounded-result-set)
43. [Synchronous Blocking I/O in Loop](#43-synchronous-blocking-io-in-loop)

**Parte 3 — Recomendaciones por Stack**

---

# Parte 1 — Concurrencia, Memoria y Seguridad Temporal

## 1. TOCTOU (Time-Of-Check to Time-Of-Use)

**Definición:** vulnerabilidad donde el estado de un recurso cambia en el intervalo entre que se verifica una condición y el momento en que se usa el resultado de esa verificación. Es la vulnerabilidad temporal más clásica en sistemas de archivos y control de acceso.

**Por qué importa:** permite ataques de escalación de privilegios, sobrescritura de archivos y symlink attacks. Es explotable incluso en código "correcto a simple vista".

### Java
```java
// VULNERABLE
File f = new File("/tmp/data.txt");
if (f.exists() && f.canWrite()) {          // TIME OF CHECK
    try (FileWriter fw = new FileWriter(f)) { // TIME OF USE
        fw.write("datos sensibles");
        // Un atacante pudo reemplazar /tmp/data.txt por un symlink
        // hacia /etc/passwd entre el check y el use.
    }
}

// SEGURO: usar operación atómica con NIO.2
Path path = Paths.get("/tmp/data.txt");
try (SeekableByteChannel ch = Files.newByteChannel(
        path,
        EnumSet.of(StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE),
        PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rw-------")))) {
    ch.write(ByteBuffer.wrap("datos sensibles".getBytes()));
}
```

### Python
```python
# VULNERABLE
import os
if os.path.exists("/tmp/data.txt") and os.access("/tmp/data.txt", os.W_OK):  # CHECK
    with open("/tmp/data.txt", "w") as f:  # USE — race window aquí
        f.write("datos sensibles")

# SEGURO: usar os.open con O_NOFOLLOW y O_EXCL (atómico a nivel de syscall)
import os
fd = os.open(
    "/tmp/data.txt",
    os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW,
    0o600
)
with os.fdopen(fd, "w") as f:
    f.write("datos sensibles")
```

### Node.js
```javascript
// VULNERABLE
const fs = require('fs');
if (fs.existsSync('/tmp/data.txt')) {      // CHECK
    fs.writeFileSync('/tmp/data.txt', 'datos sensibles'); // USE
}

// SEGURO: usar flags atómicos de bajo nivel
const fs = require('fs');
try {
    const fd = fs.openSync('/tmp/data.txt', fs.constants.O_WRONLY
        | fs.constants.O_CREAT
        | fs.constants.O_EXCL
        | fs.constants.O_NOFOLLOW, 0o600);
    fs.writeSync(fd, 'datos sensibles');
    fs.closeSync(fd);
} catch (err) {
    if (err.code === 'EEXIST') { /* manejar colisión */ }
}
```

**Mitigación general:** reemplazar "check-then-act" por operaciones atómicas provistas por el sistema operativo (`O_EXCL`, `O_NOFOLLOW`, `openat2` con `RESOLVE_NO_SYMLINKS` en Linux ≥5.6).

---

## 2. Race Condition

**Definición:** categoría general de bugs donde el resultado correcto de un programa depende del orden o el timing relativo de ejecución de hilos/procesos, orden que no está garantizado.

### Java
```java
// VULNERABLE
class Counter {
    private int count = 0;
    void increment() { count++; } // no atómico: read-modify-write
}
// Con 2 hilos ejecutando increment() 1000 veces cada uno,
// el resultado final casi nunca es 2000.

// SEGURO
class Counter {
    private final AtomicInteger count = new AtomicInteger(0);
    void increment() { count.incrementAndGet(); }
}
```

### Python
```python
# VULNERABLE (el GIL no protege operaciones compuestas)
counter = 0
def increment():
    global counter
    counter += 1  # read-modify-write no atómico

# SEGURO
import threading
lock = threading.Lock()
counter = 0
def increment():
    global counter
    with lock:
        counter += 1
```

### Node.js
```javascript
// VULNERABLE (async, no multihilo, pero el intercalado async sí causa races)
let balance = 100;
async function withdraw(amount) {
    if (balance >= amount) {          // check
        await someAsyncDelay();       // yield al event loop — otra llamada puede colarse aquí
        balance -= amount;            // use
    }
}

// SEGURO: usar una cola/mutex lógico (ej. async-mutex)
const { Mutex } = require('async-mutex');
const mutex = new Mutex();
async function withdraw(amount) {
    const release = await mutex.acquire();
    try {
        if (balance >= amount) {
            balance -= amount;
        }
    } finally {
        release();
    }
}
```

---

## 3. Data Race

**Definición:** subtipo específico de race condition a nivel de memoria: dos o más hilos acceden a la misma ubicación de memoria concurrentemente, sin sincronización, y al menos uno de los accesos es de escritura. En C/C++/Java es **comportamiento indefinido** o produce corrupción silenciosa.

### Java
```java
// VULNERABLE — visibilidad entre hilos no garantizada sin 'volatile'
class Flag {
    private boolean ready = false;
    void producer() { ready = true; }
    void consumer() {
        while (!ready) { /* puede hacer loop infinito por caché de CPU */ }
    }
}

// SEGURO
class Flag {
    private volatile boolean ready = false; // garantiza happens-before
    void producer() { ready = true; }
    void consumer() { while (!ready) { } }
}
```

### Python
```python
# CPython: el GIL serializa bytecodes, pero operaciones compuestas
# (list.append en algunos casos con C extensions, o multiprocessing
# con memoria compartida) sí tienen data races reales.
from multiprocessing import Value, Process

def worker(shared_val):
    for _ in range(100000):
        with shared_val.get_lock():   # sin esto: data race real entre procesos
            shared_val.value += 1

shared = Value('i', 0)
procs = [Process(target=worker, args=(shared,)) for _ in range(4)]
```

### Node.js
```javascript
// Node.js es single-threaded en el event loop principal, por lo que
// data races clásicos (memoria compartida entre hilos) no ocurren
// salvo usando Worker Threads con SharedArrayBuffer.
const { Worker, isMainThread, workerData } = require('worker_threads');
const sab = new SharedArrayBuffer(4);
const view = new Int32Array(sab);

// VULNERABLE si dos workers escriben sin Atomics
view[0] = view[0] + 1;

// SEGURO
Atomics.add(view, 0, 1);
```

---

## 4. Deadlock

**Definición:** dos o más procesos/hilos quedan bloqueados indefinidamente porque cada uno posee un recurso que el otro necesita, formando un ciclo de espera. Requiere las 4 condiciones de Coffman: exclusión mutua, retención-y-espera, no apropiación, espera circular.

### Java
```java
// VULNERABLE
Object lockA = new Object();
Object lockB = new Object();

// Hilo 1
synchronized (lockA) {
    synchronized (lockB) { /* ... */ }
}
// Hilo 2 (orden invertido -> deadlock potencial)
synchronized (lockB) {
    synchronized (lockA) { /* ... */ }
}

// SEGURO: orden global consistente de adquisición de locks
// (siempre adquirir lockA antes que lockB, en todos los hilos)
```

### Python
```python
import threading
lock_a = threading.Lock()
lock_b = threading.Lock()

# SEGURO: usar timeout para detectar y romper deadlocks
def worker():
    if lock_a.acquire(timeout=2):
        try:
            if lock_b.acquire(timeout=2):
                try:
                    pass
                finally:
                    lock_b.release()
        finally:
            lock_a.release()
```

### Node.js
```javascript
// Deadlocks "clásicos" de locks son raros en JS single-thread,
// pero SÍ ocurren deadlocks lógicos con Promises esperándose entre sí,
// o en pools de conexión a DB.

// VULNERABLE: dos transacciones DB esperando locks de fila en orden inverso
// (esto ocurre a nivel de la base de datos, no de Node.js)
await client.query('BEGIN');
await client.query('UPDATE accounts SET balance = balance - 100 WHERE id = 1');
await client.query('UPDATE accounts SET balance = balance + 100 WHERE id = 2');
await client.query('COMMIT');
// Si otra transacción concurrente actualiza id=2 luego id=1, hay deadlock en Postgres.

// SEGURO: ordenar siempre las actualizaciones por una clave consistente (ej. id ascendente)
const [first, second] = id1 < id2 ? [id1, id2] : [id2, id1];
```

---

## 5. Livelock

**Definición:** los procesos cambian activamente de estado en respuesta al otro (no están bloqueados), pero ninguno logra progresar. Es "peor" que un deadlock para diagnosticar porque el sistema parece activo (alto uso de CPU) sin avanzar.

### Java
```java
// Ejemplo clásico: dos hilos que "ceden el paso" cortésmente en bucle
class Resource {
    boolean available = true;
}
// Ambos hilos detectan colisión, liberan el recurso y reintentan
// exactamente al mismo tiempo, indefinidamente (sin backoff aleatorio).

// SOLUCIÓN: exponential backoff con jitter
Random rand = new Random();
int attempt = 0;
while (!tryAcquire(resource)) {
    Thread.sleep((long) (Math.pow(2, attempt++) * 10 + rand.nextInt(50)));
}
```

### Python
```python
import random, time

def try_acquire_with_backoff(resource, max_attempts=10):
    for attempt in range(max_attempts):
        if resource.try_lock():
            return True
        time.sleep((2 ** attempt) * 0.01 + random.uniform(0, 0.05))  # jitter
    return False
```

### Node.js
```javascript
async function tryAcquireWithBackoff(resource, maxAttempts = 10) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (await resource.tryLock()) return true;
        const delay = Math.pow(2, attempt) * 10 + Math.random() * 50;
        await new Promise(r => setTimeout(r, delay));
    }
    return false;
}
```

---

## 6. Starvation

**Definición:** un proceso nunca obtiene acceso a un recurso compartido porque otros procesos, favorecidos por el scheduler o la política de asignación, lo acaparan indefinidamente.

### Java
```java
// VULNERABLE: ReentrantLock no justo puede causar starvation
Lock lock = new ReentrantLock(); // fairness = false por defecto

// SEGURO: modo "fair" respeta orden FIFO de solicitudes
Lock fairLock = new ReentrantLock(true);
```

### Python
```python
# El GIL de CPython puede causar starvation de hilos de I/O
# si hilos CPU-bound acaparan el GIL. Solución: usar multiprocessing
# o liberar el GIL explícitamente en extensiones C, o usar asyncio
# para I/O-bound en vez de threading.
```

### Node.js
```javascript
// VULNERABLE: un handler síncrono pesado bloquea el event loop,
// "matando de hambre" a todas las demás requests
app.get('/heavy', (req, res) => {
    let result = 0;
    for (let i = 0; i < 1e10; i++) result += i; // bloquea el loop
    res.json({ result });
});

// SEGURO: delegar a un worker thread o dividir en microtasks
const { Worker } = require('worker_threads');
app.get('/heavy', (req, res) => {
    const worker = new Worker('./heavy-computation.js');
    worker.on('message', (result) => res.json({ result }));
});
```

---

## 7. Priority Inversion

**Definición:** un proceso de alta prioridad queda bloqueado esperando un recurso retenido por un proceso de baja prioridad, mientras procesos de prioridad media se ejecutan libremente, invirtiendo efectivamente el orden de prioridades. Caso histórico real: Mars Pathfinder (1997).

### Java
```java
// Java no expone control de prioridad de threads a nivel de SO de forma
// confiable, pero el patrón aplica en pools con prioridades lógicas.
// Solución conceptual: Priority Inheritance Protocol —
// el hilo de baja prioridad "hereda" temporalmente la prioridad
// del hilo de alta prioridad que espera su recurso.

ExecutorService highPriorityPool = Executors.newFixedThreadPool(2);
ExecutorService lowPriorityPool = Executors.newFixedThreadPool(2);
// Separar pools evita que tareas de baja prioridad bloqueen recursos
// compartidos con tareas críticas.
```

### Python
```python
# En sistemas de tiempo real con Python (ej. RTOS embebido con MicroPython),
# se usa Priority Inheritance a nivel de mutex del kernel.
# A nivel de aplicación: usar colas de prioridad explícitas.
import queue
pq = queue.PriorityQueue()
pq.put((1, "tarea_critica"))   # prioridad más baja el número = más urgente
pq.put((5, "tarea_normal"))
```

### Node.js
```javascript
// Implementar colas de prioridad para evitar que tareas de fondo
// bloqueen recursos que necesita el flujo crítico
class PriorityQueue {
    constructor() { this.items = []; }
    enqueue(item, priority) {
        this.items.push({ item, priority });
        this.items.sort((a, b) => a.priority - b.priority);
    }
    dequeue() { return this.items.shift()?.item; }
}
```

---

## 8. ABA Problem

**Definición:** en algoritmos lock-free basados en Compare-And-Swap (CAS), un valor cambia de A a B y vuelve a A entre la lectura y el CAS; el CAS lo interpreta como "sin cambios" cuando en realidad el estado intermedio pudo invalidar la operación.

### Java
```java
// VULNERABLE conceptualmente con AtomicReference simple en una pila lock-free
AtomicReference<Node> top = new AtomicReference<>();
Node oldTop = top.get();       // lee A
// ... otro hilo hace pop(A), push(C), push(A) -> top vuelve a ser A (misma referencia)
top.compareAndSet(oldTop, oldTop.next); // CAS "exitoso" pero next es incorrecto

// SEGURO: usar AtomicStampedReference (versión + valor)
AtomicStampedReference<Node> stampedTop = new AtomicStampedReference<>(null, 0);
int[] stampHolder = new int[1];
Node ref = stampedTop.get(stampHolder);
int stamp = stampHolder[0];
stampedTop.compareAndSet(ref, ref.next, stamp, stamp + 1); // el stamp detecta el ciclo A-B-A
```

### Python
```python
# Python rara vez implementa estructuras lock-free manualmente (el GIL
# lo hace innecesario en la mayoría de los casos), pero el patrón aplica
# al diseñar sistemas distribuidos con optimistic locking basado en versión:
def update_with_version(record_id, expected_version, new_data):
    # UPDATE ... WHERE id = %s AND version = %s
    # Si otra transacción cambió v1->v2->v1 "lógicamente" (raro pero posible
    # en sistemas con revert), se necesita un timestamp o UUID de versión,
    # no solo un contador, para evitar el equivalente al ABA problem.
    pass
```

### Node.js
```javascript
// Equivalente en sistemas distribuidos: optimistic concurrency control
// con un campo de versión (no solo un booleano/estado) en documentos NoSQL
async function updateDocument(id, expectedVersion, newData) {
    const result = await collection.updateOne(
        { _id: id, version: expectedVersion },  // evita ABA usando version, no solo estado
        { $set: { ...newData }, $inc: { version: 1 } }
    );
    if (result.matchedCount === 0) {
        throw new Error('Conflicto de versión detectado (posible ABA)');
    }
}
```

---

## 9. Use-After-Free (UAF)

**Definición:** se accede a una región de memoria después de haber sido liberada. En lenguajes sin garbage collector (C/C++) es una de las vulnerabilidades de memoria más explotadas (CWE-416). En lenguajes gestionados aparece como variantes lógicas.

### Java
```java
// Java tiene GC, así que UAF clásico no existe, pero el equivalente lógico
// es retener una referencia a un recurso ya cerrado:
Connection conn = dataSource.getConnection();
conn.close();
conn.createStatement(); // SQLException: conexión ya cerrada — "use after free" lógico

// SEGURO: try-with-resources garantiza el ciclo de vida correcto
try (Connection conn2 = dataSource.getConnection();
     Statement stmt = conn2.createStatement()) {
    stmt.executeQuery("SELECT 1");
} // conn2 se cierra automáticamente al salir del bloque
```

### Python
```python
# Equivalente lógico: usar un file descriptor o socket después de cerrarlo
f = open("data.txt")
f.close()
f.read()  # ValueError: I/O operation on closed file

# SEGURO: usar context manager
with open("data.txt") as f:
    data = f.read()
# f queda cerrado automáticamente, y cualquier uso posterior es detectado
```

### Node.js
```javascript
// Equivalente: usar un stream o conexión después de destruirla
const stream = fs.createReadStream('file.txt');
stream.destroy();
stream.read(); // comportamiento indefinido / error

// SEGURO: verificar estado antes de usar, o encapsular el ciclo de vida
if (!stream.destroyed) {
    stream.read();
}
```

---

## 10. Double-Free

**Definición:** se libera la misma región de memoria dos veces, corrompiendo las estructuras internas del heap allocator y abriendo la puerta a ejecución de código arbitrario (CWE-415).

### Java / Python / Node.js
```text
No aplica directamente: estos lenguajes usan garbage collection y no
exponen free() manual. El equivalente lógico es cerrar el mismo recurso
externo (archivo, socket, conexión DB) dos veces.
```

```java
// Equivalente lógico en Java
Connection conn = dataSource.getConnection();
conn.close();
conn.close(); // usualmente no-op seguro en JDBC, pero en recursos custom puede lanzar excepción

// En recursos custom, verificar estado antes de liberar:
class CustomResource implements AutoCloseable {
    private boolean closed = false;
    public void close() {
        if (closed) return; // idempotencia — previene "double free" lógico
        closed = true;
        // liberar recurso real
    }
}
```

```python
# Equivalente en Python: cerrar dos veces un socket puede lanzar OSError
sock = socket.socket()
sock.close()
sock.close()  # OSError: [Errno 9] Bad file descriptor (en algunos casos)

# SEGURO: patrón idempotente
class SafeResource:
    def __init__(self):
        self._closed = False
    def close(self):
        if self._closed:
            return
        self._closed = True
        # liberar recurso real
```

```javascript
// Equivalente en Node.js: cerrar un pool de conexiones dos veces
await pool.end();
await pool.end(); // puede lanzar "Called end on pool more than once"

// SEGURO
let poolEnded = false;
async function closePool() {
    if (poolEnded) return;
    poolEnded = true;
    await pool.end();
}
```

---

## 11. Dangling Pointer

**Definición:** un puntero/referencia que apunta a memoria que ya fue liberada o que quedó fuera de su alcance de vida válido (stack frame retornado, por ejemplo).

### Java
```java
// Java no tiene punteros crudos, pero el equivalente es una referencia
// a un objeto cuyo recurso subyacente (nativo) ya no es válido:
ByteBuffer direct = ByteBuffer.allocateDirect(1024);
// ... si se usa Cleaner/deallocate manual y luego se accede al buffer,
// se produce un crash de JVM (comportamiento equivalente a dangling pointer)
```

### Python
```python
# Python usa reference counting + GC, por lo que dangling pointers clásicos
# no ocurren en código puro. Sí pueden ocurrir en extensiones C (ctypes):
import ctypes
buf = ctypes.create_string_buffer(b"hello")
ptr = ctypes.addressof(buf)
del buf  # el buffer puede ser recolectado
# usar 'ptr' después de esto es un dangling pointer real
```

### Node.js
```javascript
// Equivalente con FinalizationRegistry / WeakRef y recursos nativos (N-API)
// en addons nativos de C++: liberar un objeto nativo y luego invocarlo
// desde JS produce un crash del proceso, no una excepción manejable.
```

---

## 12. Memory Leak

**Definición:** memoria reservada que nunca se libera porque el programa mantiene referencias vivas involuntariamente, degradando el sistema progresivamente hasta el agotamiento de recursos (OOM).

### Java
```java
// VULNERABLE: listeners nunca removidos
class EventBus {
    private List<Listener> listeners = new ArrayList<>();
    void subscribe(Listener l) { listeners.add(l); }
    // sin unsubscribe(), cada objeto suscrito nunca es recolectado por el GC
}

// SEGURO: usar WeakReference para listeners de larga vida
class EventBus {
    private List<WeakReference<Listener>> listeners = new ArrayList<>();
    void subscribe(Listener l) { listeners.add(new WeakReference<>(l)); }
}
```

### Python
```python
# VULNERABLE: closures o caches sin límite retienen referencias indefinidamente
cache = {}
def process(key, large_object):
    cache[key] = large_object  # crece sin límite, nunca se libera

# SEGURO: usar functools.lru_cache con maxsize, o WeakValueDictionary
from functools import lru_cache
@lru_cache(maxsize=1000)
def process(key):
    return compute_expensive(key)
```

### Node.js
```javascript
// VULNERABLE: closures reteniendo referencias en listeners de eventos
const emitter = new EventEmitter();
function attachHandlers() {
    const largeData = new Array(1000000).fill('x');
    emitter.on('event', () => console.log(largeData.length)); // nunca se remueve
}

// SEGURO: remover listeners explícitamente y usar límites
emitter.setMaxListeners(10); // alerta temprana de leak potencial
const handler = () => console.log('evento');
emitter.on('event', handler);
emitter.removeListener('event', handler); // cuando ya no se necesita
```

---

## 13. Buffer Overflow

**Definición:** escritura de datos más allá de los límites de un buffer reservado, sobrescribiendo memoria adyacente. En C/C++ es la vulnerabilidad de memoria más históricamente explotada (CWE-120/121/122).

### Java
```java
// Java valida límites de arrays en tiempo de ejecución (lanza excepción,
// no corrupción de memoria), pero el patrón lógico persiste:
byte[] buffer = new byte[10];
buffer[15] = 1; // ArrayIndexOutOfBoundsException — seguro, pero sigue siendo un bug

// El riesgo real en Java está en JNI (código nativo interoperando)
// donde SÍ se puede corromper memoria fuera de los límites del JVM heap.
```

### Python
```python
# Python también valida límites (excepción, no corrupción):
buf = bytearray(10)
buf[15] = 1  # IndexError: bytearray index out of range

# El riesgo real está en extensiones C/Cython o en el uso de ctypes/struct
# con buffers de tamaño fijo mal calculados:
import struct
struct.pack('>I', 999999999999)  # struct.error si excede el tamaño del formato
```

### Node.js
```javascript
// Node.js con Buffer SÍ puede tener comportamiento inseguro si se usa mal:
const buf = Buffer.alloc(10);
buf.write('esto es una cadena mucho más larga que 10 bytes'); // trunca silenciosamente, no lanza error

// SEGURO: validar longitud antes de escribir, o usar Buffer.from con control explícito
const data = 'esto es una cadena mucho más larga que 10 bytes';
if (Buffer.byteLength(data) > buf.length) {
    throw new RangeError('Datos exceden el tamaño del buffer');
}
```

---

## 14. Atomicity Violation

**Definición:** una secuencia de operaciones que debía ejecutarse como unidad indivisible (todo o nada) es interrumpida a mitad de camino por otro hilo/transacción, dejando el estado inconsistente.

### Java
```java
// VULNERABLE
class Account {
    private int balance = 100;
    void withdraw(int amount) {
        if (balance >= amount) {   // check
            // otro hilo puede ejecutar withdraw() aquí
            balance -= amount;      // act
        }
    }
}

// SEGURO: sincronizar la operación completa como unidad atómica
class Account {
    private int balance = 100;
    synchronized void withdraw(int amount) {
        if (balance >= amount) {
            balance -= amount;
        }
    }
}
```

### Python
```python
# VULNERABLE
class Account:
    def __init__(self):
        self.balance = 100
    def withdraw(self, amount):
        if self.balance >= amount:
            self.balance -= amount

# SEGURO
import threading
class Account:
    def __init__(self):
        self.balance = 100
        self._lock = threading.Lock()
    def withdraw(self, amount):
        with self._lock:
            if self.balance >= amount:
                self.balance -= amount
```

### Node.js
```javascript
// A nivel de base de datos, la atomicidad se garantiza con transacciones
// y operaciones atómicas nativas, no con locks en memoria:

// VULNERABLE
const account = await db.query('SELECT balance FROM accounts WHERE id = $1', [id]);
if (account.balance >= amount) {
    await db.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [amount, id]);
}

// SEGURO: operación atómica única a nivel de SQL, sin check-then-act separado
await db.query(
    'UPDATE accounts SET balance = balance - $1 WHERE id = $2 AND balance >= $1',
    [amount, id]
); // atómico: el WHERE valida la condición en la misma operación
```

---

## 15. Order Violation

**Definición:** el código asume implícitamente un orden de ejecución entre hilos que el sistema no garantiza, típicamente relacionado con inicialización o publicación de objetos.

### Java
```java
// VULNERABLE: publicación insegura de un objeto
class Config {
    static Config instance;
    static void init() { instance = new Config(); } // sin sincronización
}
// Otro hilo puede ver 'instance' no-null pero parcialmente construido

// SEGURO: usar inicialización estática (garantizada thread-safe por el JLS)
class Config {
    private static final Config INSTANCE = new Config();
    static Config getInstance() { return INSTANCE; }
}
```

### Python
```python
# VULNERABLE: asumir que un hilo de inicialización terminó antes de usarlo
config = None
def init_config():
    global config
    config = load_config()  # tarda tiempo

threading.Thread(target=init_config).start()
use(config)  # puede ejecutarse antes de que config esté listo (None)

# SEGURO: usar un Event para sincronizar el orden
ready = threading.Event()
def init_config():
    global config
    config = load_config()
    ready.set()

threading.Thread(target=init_config).start()
ready.wait()
use(config)
```

### Node.js
```javascript
// VULNERABLE: asumir que una inicialización async terminó
let config;
initConfig().then(c => config = c);
use(config); // undefined — se ejecuta antes de que la promesa resuelva

// SEGURO: esperar explícitamente la inicialización
async function main() {
    const config = await initConfig();
    use(config);
}
```

---

## 16. Lost Update

**Definición:** dos transacciones leen el mismo dato y ambas escriben basándose en ese valor leído; la segunda escritura sobrescribe la primera sin tener en cuenta el cambio intermedio, "perdiendo" la primera actualización.

### Java (JPA/Hibernate)
```java
// VULNERABLE: sin control de concurrencia
Product p = entityManager.find(Product.class, id);
p.setStock(p.getStock() - 1);
entityManager.merge(p); // si otro hilo hizo lo mismo en paralelo, se pierde una unidad de stock

// SEGURO: optimistic locking con @Version
@Entity
class Product {
    @Version
    private Long version;
    private int stock;
}
// Hibernate agrega automáticamente WHERE version = ? y lanza
// OptimisticLockException si el registro cambió entremedio
```

### Python (SQLAlchemy)
```python
# SEGURO: version_id_col nativo de SQLAlchemy
class Product(Base):
    __tablename__ = 'products'
    id = Column(Integer, primary_key=True)
    stock = Column(Integer)
    version_id = Column(Integer, nullable=False, default=1)
    __mapper_args__ = {'version_id_col': version_id}

# SQLAlchemy lanza StaleDataError si el version_id no coincide al hacer UPDATE
```

### Node.js (SQL directo)
```javascript
// SEGURO: UPDATE condicional con versión (optimistic locking manual)
const result = await db.query(
    'UPDATE products SET stock = stock - 1, version = version + 1 WHERE id = $1 AND version = $2',
    [id, currentVersion]
);
if (result.rowCount === 0) {
    throw new Error('Conflicto de concurrencia: el registro cambió (lost update evitado)');
}
```

---

## 17. Dirty Read

**Definición:** una transacción lee datos escritos por otra transacción que aún no ha hecho `COMMIT`. Si la segunda transacción hace `ROLLBACK`, la primera trabajó con datos que nunca existieron oficialmente.

### SQL (aplica igual en Java/Python/Node.js vía el driver)
```sql
-- Transacción A
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
-- (sin COMMIT todavía)

-- Transacción B, con nivel de aislamiento READ UNCOMMITTED
BEGIN;
SELECT balance FROM accounts WHERE id = 1; -- lee el valor no confirmado
COMMIT;

-- Transacción A hace ROLLBACK -> B trabajó con un dato "fantasma"
```

### Java
```java
Connection conn = dataSource.getConnection();
conn.setTransactionIsolation(Connection.TRANSACTION_READ_COMMITTED); // evita dirty read
```

### Python
```python
# psycopg2 / SQLAlchemy
conn = engine.connect().execution_options(isolation_level="READ COMMITTED")
```

### Node.js
```javascript
// pg (node-postgres)
await client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED');
```

**Nota:** PostgreSQL usa `READ COMMITTED` por defecto y no implementa `READ UNCOMMITTED` realmente (lo trata como `READ COMMITTED`). MySQL con InnoDB sí permite `READ UNCOMMITTED` real.

---

## 18. Non-Repeatable Read

**Definición:** dentro de la misma transacción, el mismo `SELECT` ejecutado dos veces retorna valores distintos para la misma fila, porque otra transacción la modificó y confirmó (`COMMIT`) entre ambas lecturas.

### Ejemplo (independiente del lenguaje, a nivel de aislamiento de transacción)
```sql
-- Transacción A
BEGIN;
SELECT balance FROM accounts WHERE id = 1; -- retorna 100

-- Transacción B (concurrente)
UPDATE accounts SET balance = 50 WHERE id = 1;
COMMIT;

-- Transacción A (misma transacción, segunda lectura)
SELECT balance FROM accounts WHERE id = 1; -- retorna 50 (¡cambió!)
COMMIT;
```

**Solución:** usar nivel de aislamiento `REPEATABLE READ` o superior.

```java
conn.setTransactionIsolation(Connection.TRANSACTION_REPEATABLE_READ);
```
```python
conn = engine.connect().execution_options(isolation_level="REPEATABLE READ")
```
```javascript
await client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ');
```

---

## 19. Phantom Read

**Definición:** similar a non-repeatable read, pero afecta a conjuntos de filas: una transacción repite una consulta con `WHERE` y obtiene un conjunto de filas distinto (filas "fantasma" insertadas o eliminadas por otra transacción confirmada).

```sql
-- Transacción A
BEGIN;
SELECT COUNT(*) FROM orders WHERE status = 'pending'; -- retorna 5

-- Transacción B
INSERT INTO orders (status) VALUES ('pending');
COMMIT;

-- Transacción A (misma transacción)
SELECT COUNT(*) FROM orders WHERE status = 'pending'; -- retorna 6
COMMIT;
```

**Solución:** nivel de aislamiento `SERIALIZABLE`, el único que previene phantom reads garantizadamente (a costa de mayor contención y posibles retries por conflicto de serialización).

```java
conn.setTransactionIsolation(Connection.TRANSACTION_SERIALIZABLE);
```
```python
conn = engine.connect().execution_options(isolation_level="SERIALIZABLE")
```
```javascript
await client.query('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE');
```

---

## 20. Write Skew

**Definición:** anomalía avanzada donde dos transacciones concurrentes leen datos solapados, verifican una invariante de negocio que parece válida individualmente, y ambas escriben de forma que la invariante conjunta queda violada — **incluso bajo Snapshot Isolation**, que sí previene lost update pero no write skew.

### Ejemplo clásico: guardia médica
```sql
-- Invariante de negocio: siempre debe haber al menos 1 médico de guardia.
-- Transacción A (médico 1 se da de baja)
BEGIN;
SELECT COUNT(*) FROM doctors WHERE on_call = true; -- ve 2 (médico 1 y 2)
UPDATE doctors SET on_call = false WHERE id = 1;
COMMIT;

-- Transacción B (médico 2 se da de baja, concurrente)
BEGIN;
SELECT COUNT(*) FROM doctors WHERE on_call = true; -- también ve 2 (snapshot previo al commit de A)
UPDATE doctors SET on_call = false WHERE id = 2;
COMMIT;

-- Resultado: 0 médicos de guardia, violando la invariante,
-- aunque cada transacción individualmente parecía segura.
```

**Solución:** usar `SERIALIZABLE` (con SSI — Serializable Snapshot Isolation en PostgreSQL) o bloqueos explícitos (`SELECT ... FOR UPDATE`) sobre las filas relevantes para forzar serialización real.

```sql
BEGIN;
SELECT * FROM doctors WHERE on_call = true FOR UPDATE; -- bloquea las filas leídas
UPDATE doctors SET on_call = false WHERE id = 1;
COMMIT;
```

---

## 21. Confused Deputy Problem

**Definición:** un programa con más privilegios que el usuario que lo invoca es engañado para que abuse de su propia autoridad en beneficio del atacante. Es la base conceptual de vulnerabilidades como CSRF y SSRF.

### Java (ejemplo: SSRF como confused deputy)
```java
// VULNERABLE: el backend (con acceso a la red interna) sigue una URL
// controlada por el usuario sin validar
@GetMapping("/fetch-image")
public byte[] fetchImage(@RequestParam String url) {
    return restTemplate.getForObject(url, byte[].class);
    // el atacante pasa url=http://169.254.169.254/latest/meta-data/
    // y el backend (el "deputy" con privilegios de red interna) se lo trae
}

// SEGURO: whitelist de dominios permitidos + bloqueo de rangos privados
private static final Set<String> ALLOWED_HOSTS = Set.of("cdn.miempresa.com");
public byte[] fetchImage(String url) {
    URI uri = URI.create(url);
    if (!ALLOWED_HOSTS.contains(uri.getHost())) {
        throw new SecurityException("Host no permitido");
    }
    return restTemplate.getForObject(url, byte[].class);
}
```

### Python
```python
# VULNERABLE
import requests
def fetch_image(url):
    return requests.get(url).content  # SSRF: puede apuntar a metadata de AWS/GCP

# SEGURO
import ipaddress
from urllib.parse import urlparse

ALLOWED_HOSTS = {"cdn.miempresa.com"}

def fetch_image(url):
    host = urlparse(url).hostname
    if host not in ALLOWED_HOSTS:
        raise ValueError("Host no permitido")
    return requests.get(url, timeout=5).content
```

### Node.js
```javascript
// VULNERABLE
app.get('/fetch-image', async (req, res) => {
    const response = await fetch(req.query.url); // SSRF
    res.send(await response.buffer());
});

// SEGURO
const ALLOWED_HOSTS = new Set(['cdn.miempresa.com']);
app.get('/fetch-image', async (req, res) => {
    const url = new URL(req.query.url);
    if (!ALLOWED_HOSTS.has(url.hostname)) {
        return res.status(403).send('Host no permitido');
    }
    const response = await fetch(url.toString());
    res.send(Buffer.from(await response.arrayBuffer()));
});
```

---

## 22. Lock Convoy

**Definición:** múltiples hilos compiten repetidamente por el mismo lock de alta contención, causando que el trabajo se serialice por completo aunque las tareas sean, en principio, paralelizables — degradando el rendimiento en cascada.

### Java
```java
// VULNERABLE: un único lock global protegiendo toda la caché
class Cache {
    private final Object lock = new Object();
    private Map<String, Object> data = new HashMap<>();
    Object get(String key) {
        synchronized (lock) { return data.get(key); } // serializa TODAS las lecturas
    }
}

// SEGURO: usar ConcurrentHashMap (locking interno segmentado)
class Cache {
    private final ConcurrentHashMap<String, Object> data = new ConcurrentHashMap<>();
    Object get(String key) { return data.get(key); }
}
```

### Python
```python
# VULNERABLE: un lock global para toda la estructura
class Cache:
    def __init__(self):
        self._lock = threading.Lock()
        self._data = {}
    def get(self, key):
        with self._lock:
            return self._data.get(key)

# SEGURO: sharding de locks (lock striping)
class ShardedCache:
    def __init__(self, num_shards=16):
        self._shards = [{} for _ in range(num_shards)]
        self._locks = [threading.Lock() for _ in range(num_shards)]
    def _shard_for(self, key):
        return hash(key) % len(self._shards)
    def get(self, key):
        i = self._shard_for(key)
        with self._locks[i]:
            return self._shards[i].get(key)
```

### Node.js
```javascript
// El event loop single-thread evita lock convoys clásicos, pero el
// equivalente es un mutex compartido en Redis para operaciones distribuidas.
// VULNERABLE: un único lock distribuido para todas las operaciones de caché
const lockKey = 'global:cache:lock';

// SEGURO: locks particionados por key
function lockKeyFor(key) {
    return `cache:lock:${key}`; // cada key tiene su propio lock, reduce contención
}
```

---

## 23. Thundering Herd

**Definición:** muchos procesos/hilos que esperaban un evento despiertan simultáneamente cuando el evento ocurre, pero solo uno (o pocos) puede realmente proceder, generando un pico de contención inútil.

### Java
```java
// VULNERABLE: todos los hilos esperando en el mismo objeto son notificados
synchronized (lock) {
    lock.notifyAll(); // despierta a TODOS, aunque solo uno puede avanzar
}

// SEGURO: usar notify() si solo un hilo puede proceder,
// o Condition con señalización específica
Lock l = new ReentrantLock();
Condition specificCondition = l.newCondition();
l.lock();
try {
    specificCondition.signal(); // despierta solo un hilo en esa condición específica
} finally {
    l.unlock();
}
```

### Python
```python
# Mismo patrón con threading.Condition
cond = threading.Condition()
with cond:
    cond.notify(1)  # despierta solo 1 hilo en vez de notify_all()
```

### Node.js
```javascript
// Caso típico: cache expira y miles de requests golpean el backend a la vez
// VULNERABLE
async function getData(key) {
    let value = cache.get(key);
    if (!value) {
        value = await db.query('...'); // miles de requests concurrentes ejecutan esto
        cache.set(key, value);
    }
    return value;
}

// SEGURO: single-flight pattern (deduplicar requests concurrentes por key)
const inFlight = new Map();
async function getData(key) {
    let value = cache.get(key);
    if (value) return value;
    if (inFlight.has(key)) return inFlight.get(key); // reutiliza la promesa en curso
    const promise = db.query('...').then(v => {
        cache.set(key, v);
        inFlight.delete(key);
        return v;
    });
    inFlight.set(key, promise);
    return promise;
}
```

---

## 24. Split-Brain

**Definición:** en sistemas distribuidos, una partición de red hace que dos (o más) nodos crean simultáneamente que son el líder/primario, llevando a escrituras divergentes e inconsistencia de datos.

### Ejemplo conceptual (aplica a cualquier stack usando un cluster DB/cache)
```text
Cluster de 3 nodos: A (líder), B, C (réplicas).
Ocurre una partición de red: A queda aislado de B y C.
B y C, sin poder contactar a A, eligen un nuevo líder: B.
Ahora A (aislado) sigue creyendo que es el líder y acepta escrituras.
Resultado: dos "primarios" (A y B) aceptan escrituras divergentes -> split-brain.
```

### Mitigación (a nivel de arquitectura, aplica en Java/Python/Node.js por igual)
```text
- Usar quorum (mayoría de votos) para elección de líder: requiere
  N/2+1 nodos para considerar válida una elección (ej. Raft, Paxos).
- Fencing tokens: cada líder recibe un token incremental; los seguidores
  rechazan operaciones con token menor al último visto.
- Redis Sentinel / Cluster, etcd, ZooKeeper y Consul implementan
  quorum-based leader election para evitar split-brain.
```

```javascript
// Ejemplo con Redlock (algoritmo de locking distribuido de Redis)
// que mitiga split-brain en locks distribuidos usando quorum sobre N instancias Redis
const Redlock = require('redlock');
const redlock = new Redlock([redisClient1, redisClient2, redisClient3], {
    retryCount: 3,
});
const lock = await redlock.acquire(['resource:leader'], 5000);
// El lock solo se considera válido si la mayoría de instancias Redis lo confirman
```

---

## 25. Distributed Race Condition

**Definición:** race condition entre procesos que corren en **máquinas distintas**, sin memoria compartida, coordinados únicamente por red — requiere mecanismos de coordinación distribuida (no basta con locks en memoria de un solo proceso).

### Java
```java
// VULNERABLE: dos instancias del servicio verifican disponibilidad
// de un asiento y ambas lo reservan
boolean available = checkSeatAvailable(seatId); // instancia 1 y 2 ven "true" a la vez
if (available) reserveSeat(seatId, userId);       // ambas reservan

// SEGURO: lock distribuido (ej. Redisson sobre Redis) o
// constraint UNIQUE a nivel de base de datos como última línea de defensa
RLock lock = redissonClient.getLock("seat:" + seatId);
lock.lock();
try {
    if (checkSeatAvailable(seatId)) reserveSeat(seatId, userId);
} finally {
    lock.unlock();
}
```

### Python
```python
# SEGURO: usar constraint UNIQUE en DB como garantía última (defensa en profundidad)
# CREATE UNIQUE INDEX idx_seat_reservation ON reservations(seat_id);
try:
    db.execute(
        "INSERT INTO reservations (seat_id, user_id) VALUES (%s, %s)",
        (seat_id, user_id)
    )
except IntegrityError:
    raise SeatAlreadyReservedError(seat_id)
```

### Node.js
```javascript
// SEGURO: lock distribuido con Redis (SET NX PX — atómico)
async function acquireLock(key, ttlMs) {
    const token = crypto.randomUUID();
    const acquired = await redis.set(key, token, 'NX', 'PX', ttlMs);
    return acquired ? token : null;
}
const token = await acquireLock(`seat:${seatId}`, 5000);
if (token) {
    try {
        if (await checkSeatAvailable(seatId)) await reserveSeat(seatId, userId);
    } finally {
        await releaseLockIfOwner(`seat:${seatId}`, token); // libera solo si sigue siendo el dueño
    }
}
```

---

## 26. Idempotency Violation

**Definición:** una operación que debería producir el mismo resultado sin importar cuántas veces se ejecute (idempotente) se ejecuta múltiples veces por reintentos de red, duplicando efectos secundarios (cargos, emails, registros).

### Java
```java
// VULNERABLE: reintento automático de un cliente HTTP duplica el cargo
@PostMapping("/charge")
public ChargeResponse charge(@RequestBody ChargeRequest req) {
    return paymentGateway.charge(req.getAmount(), req.getCardToken());
    // si la respuesta se pierde en la red y el cliente reintenta, se cobra dos veces
}

// SEGURO: idempotency key provista por el cliente, verificada server-side
@PostMapping("/charge")
public ChargeResponse charge(@RequestHeader("Idempotency-Key") String key,
                               @RequestBody ChargeRequest req) {
    Optional<ChargeResponse> existing = idempotencyStore.get(key);
    if (existing.isPresent()) return existing.get(); // retorna el resultado previo, no cobra de nuevo
    ChargeResponse result = paymentGateway.charge(req.getAmount(), req.getCardToken());
    idempotencyStore.save(key, result, Duration.ofHours(24));
    return result;
}
```

### Python
```python
# SEGURO
@app.post("/charge")
def charge(req: ChargeRequest, idempotency_key: str = Header(...)):
    existing = idempotency_store.get(idempotency_key)
    if existing:
        return existing
    result = payment_gateway.charge(req.amount, req.card_token)
    idempotency_store.set(idempotency_key, result, ttl=86400)
    return result
```

### Node.js
```javascript
// SEGURO — patrón usado por Stripe, PayPal, etc.
app.post('/charge', async (req, res) => {
    const idempotencyKey = req.headers['idempotency-key'];
    const existing = await idempotencyStore.get(idempotencyKey);
    if (existing) return res.json(existing);

    const result = await paymentGateway.charge(req.body.amount, req.body.cardToken);
    await idempotencyStore.set(idempotencyKey, result, { ttl: 86400 });
    res.json(result);
});
```

---

# Parte 2 — Anti-Patrones de Acceso a Datos y Rendimiento

## 27. N+1 Query Problem

**Definición:** se ejecuta 1 query para obtener N registros, y luego N queries adicionales (una por registro) para obtener datos relacionados, en vez de resolverlo con una cantidad constante de queries usando `JOIN` o batching.

### Java (Hibernate/JPA)
```java
// VULNERABLE
@Entity
class Order {
    @ManyToOne(fetch = FetchType.LAZY)
    private Customer customer;
}
List<Order> orders = orderRepository.findAll(); // 1 query
for (Order o : orders) {
    System.out.println(o.getCustomer().getName()); // N queries adicionales
}

// SEGURO: JOIN FETCH
@Query("SELECT o FROM Order o JOIN FETCH o.customer")
List<Order> findAllWithCustomer();

// ALTERNATIVA: @EntityGraph (más flexible, no requiere JPQL manual)
@EntityGraph(attributePaths = {"customer"})
List<Order> findAll();
```

### Python (SQLAlchemy)
```python
# VULNERABLE
orders = session.query(Order).all()  # 1 query
for o in orders:
    print(o.customer.name)  # N queries (lazy='select' por defecto)

# SEGURO: selectinload (ideal para colecciones grandes, evita cartesian explosion)
from sqlalchemy.orm import selectinload
orders = session.query(Order).options(selectinload(Order.customer)).all()

# ALTERNATIVA: joinedload (ideal para relaciones 1:1 o pequeñas)
from sqlalchemy.orm import joinedload
orders = session.query(Order).options(joinedload(Order.customer)).all()
```

### Node.js (Prisma)
```javascript
// VULNERABLE (con un ORM que no batchea automáticamente, ej. Sequelize sin include)
const orders = await Order.findAll(); // 1 query
for (const o of orders) {
    const customer = await o.getCustomer(); // N queries
}

// SEGURO con Sequelize
const orders = await Order.findAll({ include: [Customer] }); // 1 query con JOIN

// SEGURO con Prisma (resuelve N+1 automáticamente vía query batching desde v4+)
const orders = await prisma.order.findMany({
    include: { customer: true }
});
```

### Node.js (GraphQL + DataLoader — el caso más crítico de N+1)
```javascript
const DataLoader = require('dataloader');

const customerLoader = new DataLoader(async (customerIds) => {
    const customers = await Customer.findAll({ where: { id: customerIds } });
    const map = new Map(customers.map(c => [c.id, c]));
    return customerIds.map(id => map.get(id)); // respeta el orden de las keys solicitadas
});

const resolvers = {
    Order: {
        customer: (order) => customerLoader.load(order.customerId), // batchea automáticamente
    },
};
```

---

## 28. Cartesian Product Explosion

**Definición:** al hacer `JOIN FETCH` de **múltiples** colecciones `@OneToMany` simultáneamente en una sola query, el resultado se multiplica combinatoriamente (producto cartesiano de las colecciones), generando filas duplicadas masivas y degradando el rendimiento — un efecto secundario de "solucionar" N+1 de forma ingenua.

### Java (Hibernate)
```java
// VULNERABLE: doble JOIN FETCH de colecciones -> explosión cartesiana
@Query("SELECT o FROM Order o JOIN FETCH o.items JOIN FETCH o.payments")
List<Order> findAllWithItemsAndPayments();
// Un Order con 5 items y 3 payments genera 15 filas duplicadas en el ResultSet,
// que Hibernate debe deduplicar en memoria (costoso y propenso a MultipleBagFetchException)

// SEGURO: separar en queries independientes con @BatchSize
@Entity
class Order {
    @OneToMany
    @BatchSize(size = 50) // agrupa el fetch de items en lotes de 50, no 1 por 1
    private List<Item> items;

    @OneToMany
    @BatchSize(size = 50)
    private List<Payment> payments;
}
List<Order> orders = orderRepository.findAll(); // Hibernate hace fetch batcheado, no cartesiano
```

### Python (SQLAlchemy)
```python
# VULNERABLE: joinedload de dos colecciones a la vez
orders = session.query(Order).options(
    joinedload(Order.items),
    joinedload(Order.payments)  # produce cartesian product en el SQL generado
).all()

# SEGURO: usar selectinload para colecciones (ejecuta queries separadas, sin cartesian)
orders = session.query(Order).options(
    selectinload(Order.items),
    selectinload(Order.payments)  # 2 queries adicionales con IN (...), no cartesiano
).all()
```

### Node.js (Sequelize)
```javascript
// VULNERABLE: include anidado de múltiples hasMany en un solo query
const orders = await Order.findAll({
    include: [Items, Payments] // puede generar cartesian product en el JOIN subyacente
});

// SEGURO: usar 'separate: true' para que Sequelize haga queries independientes
const orders = await Order.findAll({
    include: [
        { model: Item, separate: true },
        { model: Payment, separate: true }
    ]
});
```

---

## 29. SELECT N+1 en Serialización (API)

**Definición:** el N+1 no ocurre en el query original sino durante la **serialización** de la respuesta: cada objeto dispara accesos lazy adicionales al construir el JSON de salida, típicamente fuera del alcance del profiling de la capa de queries.

### Java (Jackson + Hibernate)
```java
// VULNERABLE: el controller retorna la entidad directamente
@GetMapping("/orders")
public List<Order> getOrders() {
    return orderRepository.findAll(); // Jackson serializa order.getCustomer() -> lazy load por cada uno
}

// SEGURO: usar un DTO proyectado, no la entidad JPA directamente
public record OrderDTO(Long id, String customerName, BigDecimal total) {}

@GetMapping("/orders")
public List<OrderDTO> getOrders() {
    return orderRepository.findAllProjected(); // query único con proyección, sin lazy loading
}

@Query("SELECT new com.app.OrderDTO(o.id, o.customer.name, o.total) FROM Order o")
List<OrderDTO> findAllProjected();
```

### Python (Django REST Framework)
```python
# VULNERABLE
class OrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name')  # N+1 si no hay prefetch

def get(self, request):
    orders = Order.objects.all()  # sin prefetch
    return Response(OrderSerializer(orders, many=True).data)  # N queries durante la serialización

# SEGURO: prefetch_related antes de serializar
def get(self, request):
    orders = Order.objects.select_related('customer').all()  # 1 query con JOIN
    return Response(OrderSerializer(orders, many=True).data)
```

### Node.js (REST con Sequelize)
```javascript
// VULNERABLE
app.get('/orders', async (req, res) => {
    const orders = await Order.findAll(); // sin include
    const result = await Promise.all(orders.map(async o => ({
        id: o.id,
        customerName: (await o.getCustomer()).name // N queries durante la construcción del JSON
    })));
    res.json(result);
});

// SEGURO
app.get('/orders', async (req, res) => {
    const orders = await Order.findAll({ include: [Customer] }); // 1 query
    res.json(orders.map(o => ({ id: o.id, customerName: o.Customer.name })));
});
```

---

## 30. Over-fetching

**Definición:** se traen más columnas, campos o relaciones de los que realmente se necesitan para la operación, desperdiciando ancho de banda, memoria y CPU de serialización.

### Java
```java
// VULNERABLE: trae la entidad completa (incluyendo BLOBs, relaciones, campos pesados)
List<Order> orders = orderRepository.findAll(); // SELECT * incluye 'notes', 'metadata', etc.

// SEGURO: proyección solo con los campos necesarios
public interface OrderSummary {
    Long getId();
    String getStatus();
}
List<OrderSummary> orders = orderRepository.findAllProjectedBy(); // SELECT id, status
```

### Python
```python
# VULNERABLE
orders = session.query(Order).all()  # trae todas las columnas

# SEGURO: cargar solo columnas específicas
from sqlalchemy.orm import load_only
orders = session.query(Order).options(load_only(Order.id, Order.status)).all()
```

### Node.js (GraphQL — resuelve over-fetching por diseño)
```javascript
// El cliente pide exactamente los campos que necesita:
const query = `
  query {
    orders {
      id
      status
    }
  }
`;
// A diferencia de REST, GraphQL no trae 'customer', 'items', 'payments'
// salvo que el cliente los solicite explícitamente en la query.
```

---

## 31. Under-fetching

**Definición:** lo opuesto a over-fetching: se traen menos datos de los necesarios para construir una vista completa, forzando múltiples round-trips adicionales al cliente o entre servicios.

### Java (arquitectura BFF)
```java
// VULNERABLE: el frontend necesita 3 llamadas para armar 1 pantalla
GET /orders/123
GET /orders/123/items
GET /orders/123/customer

// SEGURO: endpoint agregador (Backend-For-Frontend) que consolida todo en 1 llamada
@GetMapping("/orders/{id}/full")
public OrderFullView getFullOrder(@PathVariable Long id) {
    Order order = orderService.findById(id);
    return new OrderFullView(order, order.getItems(), order.getCustomer());
}
```

### Python
```python
# SEGURO: agregación server-side con un solo endpoint
@app.get("/orders/{id}/full")
def get_full_order(id: int):
    order = get_order(id)
    return {
        "order": order,
        "items": get_items(order.id),
        "customer": get_customer(order.customer_id),
    }
```

### Node.js (GraphQL soluciona under-fetching de forma nativa)
```javascript
// Una sola query trae todo lo necesario en un solo round-trip
const query = `
  query {
    order(id: 123) {
      id
      items { name, price }
      customer { name, email }
    }
  }
`;
```

---

## 32. Chatty API / Chatty I/O

**Definición:** múltiples llamadas pequeñas y secuenciales entre capas o servicios en vez de una sola llamada consolidada, multiplicando la latencia acumulada de red.

### Java (microservicios)
```java
// VULNERABLE: 20 llamadas HTTP secuenciales a un microservicio
List<ProductDetail> details = new ArrayList<>();
for (Long productId : productIds) {
    details.add(restTemplate.getForObject("/products/" + productId, ProductDetail.class));
}

// SEGURO: endpoint batch en el servicio downstream
List<ProductDetail> details = restTemplate.postForObject(
    "/products/batch",
    new BatchRequest(productIds),
    ProductDetail[].class
);
```

### Python
```python
# VULNERABLE
details = [requests.get(f"/products/{pid}").json() for pid in product_ids]

# SEGURO: batch request + ejecución concurrente si el batch no está disponible
import asyncio, httpx

async def fetch_all(product_ids):
    async with httpx.AsyncClient() as client:
        tasks = [client.get(f"/products/{pid}") for pid in product_ids]
        return await asyncio.gather(*tasks)  # paraleliza en vez de serializar
```

### Node.js
```javascript
// VULNERABLE: secuencial con await en loop
const details = [];
for (const id of productIds) {
    details.push(await fetch(`/products/${id}`).then(r => r.json()));
}

// SEGURO: paralelizar con Promise.all (o mejor, usar un endpoint batch)
const details = await Promise.all(
    productIds.map(id => fetch(`/products/${id}`).then(r => r.json()))
);
```

---

## 33. Missing Index / Full Table Scan

**Definición:** ausencia de un índice adecuado obliga al motor de base de datos a escanear la tabla completa para resolver un `WHERE`, `JOIN` o `ORDER BY`, con costo O(n) en vez de O(log n).

### Diagnóstico (independiente del lenguaje)
```sql
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'user@example.com';
-- Seq Scan on users (cost=0.00..18334.00 rows=1) -- full table scan, sin índice
```

### Solución
```sql
CREATE INDEX idx_users_email ON users(email);
-- Tras el índice:
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'user@example.com';
-- Index Scan using idx_users_email (cost=0.42..8.44 rows=1)
```

### Java (JPA — definir el índice a nivel de entidad)
```java
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_users_email", columnList = "email", unique = true)
})
class User { private String email; }
```

### Python (SQLAlchemy)
```python
class User(Base):
    __tablename__ = 'users'
    email = Column(String, index=True, unique=True)
```

### Node.js (Prisma schema)
```prisma
model User {
  id    Int    @id @default(autoincrement())
  email String @unique  // Prisma crea automáticamente un índice único
}
```

---

## 34. Implicit Type Conversion (Index Bypass)

**Definición:** una comparación con un tipo de dato incompatible con la columna indexada obliga al motor a convertir cada fila para comparar, invalidando el uso del índice existente.

### Ejemplo (SQL puro, aplica a cualquier stack)
```sql
-- Columna 'phone' es VARCHAR con índice
CREATE INDEX idx_phone ON users(phone);

-- VULNERABLE: comparación con número, fuerza conversión implícita fila por fila
SELECT * FROM users WHERE phone = 5551234567; -- el índice se ignora (full scan)

-- SEGURO: comparar con el mismo tipo de la columna
SELECT * FROM users WHERE phone = '5551234567'; -- usa el índice correctamente
```

### Java (JPA — validar tipos en la capa de acceso)
```java
// VULNERABLE: pasar un Long cuando la columna es String
@Query("SELECT u FROM User u WHERE u.phone = :phone")
User findByPhone(@Param("phone") Long phone); // JPA puede forzar conversión implícita

// SEGURO
@Query("SELECT u FROM User u WHERE u.phone = :phone")
User findByPhone(@Param("phone") String phone);
```

### Python
```python
# VULNERABLE
session.query(User).filter(User.phone == 5551234567).all()  # int vs VARCHAR

# SEGURO
session.query(User).filter(User.phone == "5551234567").all()
```

### Node.js
```javascript
// VULNERABLE
await db.query('SELECT * FROM users WHERE phone = $1', [5551234567]); // driver puede castear implícitamente

// SEGURO
await db.query('SELECT * FROM users WHERE phone = $1', ['5551234567']);
```

---

## 35. Cartesian Join (SQL puro)

**Definición:** un `JOIN` sin condición `ON` adecuada (o con `WHERE` faltante en sintaxis antigua de coma) produce el producto cartesiano completo entre dos tablas: cada fila de A combinada con cada fila de B.

```sql
-- VULNERABLE: sintaxis antigua sin condición de JOIN
SELECT * FROM orders, customers;  -- si orders tiene 1000 filas y customers 500,
                                    -- el resultado tiene 500,000 filas

-- VULNERABLE: JOIN explícito pero sin ON
SELECT * FROM orders CROSS JOIN customers; -- mismo resultado, pero al menos es explícito/intencional

-- SEGURO
SELECT * FROM orders o JOIN customers c ON o.customer_id = c.id;
```

**Detección:** herramientas como `sqlfluff` (linter SQL) o revisión de `EXPLAIN` detectan `nested loop` con cardinalidad sospechosamente alta.

---

## 36. Connection Pool Exhaustion

**Definición:** se agotan las conexiones disponibles en el pool porque las queries son lentas, no se cierran explícitamente, o el volumen de queries concurrentes (ej. por un N+1 masivo) excede la capacidad configurada.

### Java (HikariCP)
```java
// VULNERABLE: pool pequeño + queries lentas por N+1 -> exhaustion bajo carga
HikariConfig config = new HikariConfig();
config.setMaximumPoolSize(5); // insuficiente si cada request hace 50 queries por N+1

// SEGURO: dimensionar el pool según el patrón de carga real + resolver el N+1 de raíz
config.setMaximumPoolSize(20);
config.setConnectionTimeout(3000); // falla rápido en vez de colgar indefinidamente
config.setLeakDetectionThreshold(5000); // detecta conexiones no cerradas
```

### Python (SQLAlchemy)
```python
engine = create_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=10,
    pool_timeout=5,       # falla rápido en vez de bloquear indefinidamente
    pool_pre_ping=True,   # valida conexiones muertas antes de usarlas
)
```

### Node.js (pg pool)
```javascript
const pool = new Pool({
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 3000, // falla rápido si el pool está saturado
});

// SIEMPRE liberar la conexión explícitamente
const client = await pool.connect();
try {
    await client.query('SELECT 1');
} finally {
    client.release(); // crítico: sin esto, la conexión nunca vuelve al pool
}
```

---

## 37. Lazy Initialization Exception

**Definición:** se intenta acceder a una relación lazy-loaded fuera del contexto de sesión/transacción activa que la originó, produciendo una excepción en tiempo de ejecución.

### Java (Hibernate)
```java
// VULNERABLE
@GetMapping("/orders/{id}")
public Order getOrder(@PathVariable Long id) {
    return orderRepository.findById(id).get(); // la sesión se cierra al salir del método @Transactional
}
// Si el controller/serializer accede a order.getCustomer() después,
// lanza LazyInitializationException: no session or session was closed

// SEGURO: DTO proyectado dentro de la transacción, o fetch explícito
@Transactional(readOnly = true)
@GetMapping("/orders/{id}")
public OrderDTO getOrder(@PathVariable Long id) {
    Order order = orderRepository.findById(id).get();
    return new OrderDTO(order.getId(), order.getCustomer().getName()); // se resuelve dentro de la sesión activa
}
```

### Python (SQLAlchemy)
```python
# VULNERABLE: acceder a una relación lazy tras cerrar la sesión
def get_order(id):
    with Session() as session:
        order = session.query(Order).get(id)
    return order.customer.name  # DetachedInstanceError: la sesión ya cerró

# SEGURO: resolver la relación dentro del scope de la sesión
def get_order(id):
    with Session() as session:
        order = session.query(Order).options(joinedload(Order.customer)).get(id)
        return order.customer.name  # se resuelve dentro de la sesión activa
```

### Node.js
```javascript
// El equivalente en Node.js/Prisma es menos común porque no hay "sesión"
// persistente, pero ocurre con conexiones cerradas prematuramente:
const client = await pool.connect();
client.release(); // conexión devuelta al pool
await client.query('SELECT 1'); // error: conexión ya no es válida para este cliente
```

---

## 38. Slow Query / Query Plan Regression

**Definición:** un query que antes era rápido se vuelve lento porque el optimizador cambia el plan de ejecución — típicamente por estadísticas desactualizadas, crecimiento de la tabla, o cambios en la distribución de datos.

### Diagnóstico (independiente del lenguaje)
```sql
-- PostgreSQL: ver el plan actual vs el esperado
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM orders WHERE customer_id = 123;

-- Actualizar estadísticas del optimizador
ANALYZE orders;

-- Ver queries más lentas registradas (requiere pg_stat_statements)
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Java — monitoreo integrado
```java
// Hibernate: habilitar estadísticas para detectar regresiones
spring.jpa.properties.hibernate.generate_statistics=true
// Loguea automáticamente queries lentas vía logging.level.org.hibernate.SQL=DEBUG
```

### Python — monitoreo integrado
```python
# SQLAlchemy: log de queries lentas
import logging
logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

# O usar un event listener para medir tiempo real de ejecución
from sqlalchemy import event
import time

@event.listens_for(engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, params, context, executemany):
    conn.info.setdefault('query_start_time', []).append(time.time())

@event.listens_for(engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, params, context, executemany):
    total = time.time() - conn.info['query_start_time'].pop()
    if total > 0.5:  # alerta si supera 500ms
        logging.warning(f"Slow query ({total:.2f}s): {statement}")
```

### Node.js — monitoreo integrado
```javascript
// pg: medir duración de cada query
pool.on('connect', (client) => {
    const originalQuery = client.query.bind(client);
    client.query = (...args) => {
        const start = Date.now();
        const result = originalQuery(...args);
        result.then(() => {
            const duration = Date.now() - start;
            if (duration > 500) console.warn(`Slow query (${duration}ms):`, args[0]);
        });
        return result;
    };
});
```

---

## 39. Cache Stampede

**Definición:** cuando una entrada de caché muy solicitada expira, múltiples requests concurrentes detectan el "cache miss" simultáneamente y recalculan el mismo valor a la vez, golpeando la base de datos con un pico de carga innecesario.

### Java (con Caffeine + refreshAfterWrite)
```java
// VULNERABLE: expiración dura, todos los requests recalculan al mismo tiempo
Cache<String, Data> cache = Caffeine.newBuilder()
    .expireAfterWrite(Duration.ofMinutes(10))
    .build();

// SEGURO: refreshAfterWrite recalcula en background, sirviendo el valor
// stale mientras tanto (solo 1 hilo recalcula, no todos)
LoadingCache<String, Data> cache = Caffeine.newBuilder()
    .refreshAfterWrite(Duration.ofMinutes(10))
    .build(key -> loadDataFromDb(key));
```

### Python (con lock distribuido)
```python
import redis
r = redis.Redis()

def get_data(key):
    value = r.get(key)
    if value: return value

    lock_key = f"lock:{key}"
    if r.set(lock_key, "1", nx=True, ex=10):  # solo 1 proceso obtiene el lock
        try:
            value = load_from_db(key)
            r.setex(key, 600, value)
        finally:
            r.delete(lock_key)
    else:
        time.sleep(0.1)
        return get_data(key)  # reintenta, probablemente ya esté en caché
    return value
```

### Node.js (single-flight + jitter en TTL)
```javascript
const inFlight = new Map();

async function getData(key) {
    const cached = await redis.get(key);
    if (cached) return cached;

    if (inFlight.has(key)) return inFlight.get(key); // deduplica requests concurrentes

    const promise = loadFromDb(key).then(async (value) => {
        const jitter = Math.floor(Math.random() * 60); // evita expiración sincronizada
        await redis.setex(key, 600 + jitter, value);
        inFlight.delete(key);
        return value;
    });
    inFlight.set(key, promise);
    return promise;
}
```

---

## 40. Hot Partition / Hot Key

**Definición:** en bases de datos distribuidas (particionadas/shardeadas), una partición o key específica recibe una carga desproporcionada respecto al resto, generando un cuello de botella aunque el clúster tenga capacidad total sobrada.

### Ejemplo (DynamoDB / Cassandra — aplica igual desde Java, Python o Node.js)
```text
VULNERABLE: partition key = fecha del evento (ej. "2026-09-01")
Todos los eventos de "hoy" van a la misma partición física,
mientras las particiones de fechas pasadas están inactivas.
```

### Java (AWS SDK — DynamoDB)
```java
// VULNERABLE
PutItemRequest req = PutItemRequest.builder()
    .tableName("events")
    .item(Map.of("date", AttributeValue.fromS("2026-09-01"), /* ... */))
    .build();

// SEGURO: agregar un sufijo aleatorio (salting) a la partition key
String shardSuffix = String.valueOf(ThreadLocalRandom.current().nextInt(0, 10));
String shardedKey = "2026-09-01#" + shardSuffix; // distribuye la carga en 10 particiones
```

### Python
```python
# SEGURO: salting de la partition key
import random
shard_suffix = random.randint(0, 9)
sharded_key = f"2026-09-01#{shard_suffix}"
# Al leer, se consulta en las 10 particiones y se agregan los resultados
```

### Node.js
```javascript
// SEGURO
const shardSuffix = Math.floor(Math.random() * 10);
const shardedKey = `2026-09-01#${shardSuffix}`;
// Lectura: Promise.all consultando las 10 particiones y mergeando resultados
```

---

## 41. Pagination Offset Problem

**Definición:** usar `OFFSET` para paginar obliga a la base de datos a escanear y descartar todas las filas anteriores al offset solicitado; el costo crece linealmente con la profundidad de la página, degradando severamente en datasets grandes.

### SQL
```sql
-- VULNERABLE: cada página más profunda es más lenta
SELECT * FROM orders ORDER BY id LIMIT 20 OFFSET 1000000; -- escanea 1,000,020 filas para retornar 20

-- SEGURO: keyset/cursor pagination — usa el último ID visto como punto de partida
SELECT * FROM orders WHERE id > 1000000 ORDER BY id LIMIT 20; -- usa el índice directamente, O(log n)
```

### Java (Spring Data — keyset pagination)
```java
// VULNERABLE
Page<Order> page = orderRepository.findAll(PageRequest.of(50000, 20)); // offset alto

// SEGURO: Spring Data 3.1+ soporta ScrollPosition (keyset pagination nativo)
Window<Order> window = orderRepository.findBy(
    OrderSpecifications.all(),
    q -> q.sortBy(Sort.by("id")).limit(20).scroll(ScrollPosition.keyset())
);
```

### Python (SQLAlchemy con sqlakeyset)
```python
from sqlakeyset import get_page

# SEGURO: keyset pagination declarativo
query = session.query(Order).order_by(Order.id)
page = get_page(query, per_page=20, page=serialized_bookmark)
```

### Node.js (Prisma — cursor-based pagination nativo)
```javascript
// SEGURO
const orders = await prisma.order.findMany({
    take: 20,
    cursor: { id: lastSeenId },  // continúa desde el último id visto, no desde un offset
    skip: 1,                      // salta el cursor mismo
    orderBy: { id: 'asc' },
});
```

---

## 42. Unbounded Result Set

**Definición:** una query sin límite explícito puede retornar un volumen de datos impredecible, saturando memoria de la aplicación o de la base de datos, especialmente en tablas de crecimiento no acotado (logs, auditoría, eventos).

### Java
```java
// VULNERABLE
List<AuditLog> logs = auditLogRepository.findAll(); // puede traer millones de filas a memoria

// SEGURO: límite obligatorio + streaming para procesar sin cargar todo en memoria
@QueryHints(@QueryHint(name = HINT_FETCH_SIZE, value = "500"))
@Query("SELECT a FROM AuditLog a")
Stream<AuditLog> streamAll(); // procesa fila por fila sin materializar toda la colección
```

### Python
```python
# VULNERABLE
logs = session.query(AuditLog).all()  # carga todo en memoria

# SEGURO: yield_per para streaming por lotes
for log in session.query(AuditLog).yield_per(500):
    process(log)  # nunca mantiene más de 500 filas en memoria a la vez
```

### Node.js
```javascript
// VULNERABLE
const logs = await db.query('SELECT * FROM audit_logs'); // sin LIMIT

// SEGURO: streaming con cursor (pg-cursor) para datasets grandes
const Cursor = require('pg-cursor');
const cursor = client.query(new Cursor('SELECT * FROM audit_logs'));

function readNext() {
    cursor.read(500, (err, rows) => {
        if (rows.length === 0) return cursor.close();
        process(rows);
        readNext();
    });
}
readNext();
```

---

## 43. Synchronous Blocking I/O in Loop

**Definición:** llamadas de red o disco bloqueantes ejecutadas secuencialmente dentro de un loop en vez de dispararse en paralelo, multiplicando la latencia total por el número de iteraciones en vez de aprovechar concurrencia.

### Java
```java
// VULNERABLE: secuencial
List<UserData> results = new ArrayList<>();
for (Long id : userIds) {
    results.add(userServiceClient.fetchUser(id)); // bloquea hasta completar cada llamada
}

// SEGURO: CompletableFuture para paralelizar I/O
List<CompletableFuture<UserData>> futures = userIds.stream()
    .map(id -> CompletableFuture.supplyAsync(() -> userServiceClient.fetchUser(id), executor))
    .collect(Collectors.toList());
List<UserData> results = futures.stream()
    .map(CompletableFuture::join)
    .collect(Collectors.toList());
```

### Python
```python
# VULNERABLE: secuencial con requests síncrono
results = [requests.get(f"/users/{id}").json() for id in user_ids]

# SEGURO: paralelizar con asyncio + httpx
import asyncio, httpx

async def fetch_all(user_ids):
    async with httpx.AsyncClient() as client:
        tasks = [client.get(f"/users/{id}") for id in user_ids]
        responses = await asyncio.gather(*tasks)
        return [r.json() for r in responses]
```

### Node.js
```javascript
// VULNERABLE: await secuencial dentro de un for
const results = [];
for (const id of userIds) {
    results.push(await fetchUser(id)); // espera cada llamada antes de la siguiente
}

// SEGURO: Promise.all paraleliza todas las llamadas
const results = await Promise.all(userIds.map(id => fetchUser(id)));

// Con control de concurrencia (evitar saturar el servicio downstream)
const pLimit = require('p-limit');
const limit = pLimit(10); // máximo 10 llamadas concurrentes
const results = await Promise.all(userIds.map(id => limit(() => fetchUser(id))));
```

---

# Parte 3 — Recomendaciones por Stack

## Java
| Área | Recomendación | Versión / Estado |
|---|---|---|
| Concurrencia | Virtual Threads (Project Loom) para I/O-bound masivo | Estable desde JDK 21 LTS, mantenimiento activo (OpenJDK) |
| Locking optimista | `@Version` (JPA) sobre `SELECT FOR UPDATE` cuando la contención es baja | Hibernate 6.x, activo |
| N+1 | `@EntityGraph` + `@BatchSize` combinados | Sin CVEs conocidos en Hibernate 6.4+ |
| Paginación | `ScrollPosition` (keyset) en vez de `Pageable` con offset alto | Spring Data 3.1+ |
| Criptografía | Bouncy Castle para operaciones auditadas | Mantenimiento activo, uso empresarial extendido |

## Python
| Área | Recomendación | Versión / Estado |
|---|---|---|
| Gestor de paquetes | `uv` (basado en Rust) reemplaza `pip`/`poetry` — instalación 10-100x más rápida, menor uso de memoria | Activo, mantenido por Astral |
| N+1 | `selectinload()` por defecto en colecciones; `joinedload()` solo en relaciones 1:1 | SQLAlchemy 2.x, activo |
| Paginación | `sqlakeyset` para keyset pagination declarativo | Activo |
| Data-heavy | `polars` (Rust) reemplaza `pandas` en pipelines pesados — evita contención de GIL en operaciones vectorizadas, menor uso de memoria | Activo, adopción empresarial creciente |
| Concurrencia I/O | `asyncio` + `httpx` en vez de `requests` síncrono para I/O paralelo | Activo |

## Node.js
| Área | Recomendación | Versión / Estado |
|---|---|---|
| Gestor de paquetes | `pnpm` (más eficiente en disco y memoria que npm/yarn vía symlinks) | LTS, activo |
| N+1 (GraphQL) | `dataloader` (Facebook) — estándar de facto, sin CVEs conocidos | Activo |
| ORM | Prisma v5+ resuelve N+1 vía query batching interno | Activo |
| Tooling basado en Rust | SWC (compilador) reemplaza Babel — 20x más rápido; Biome reemplaza ESLint+Prettier — linter/formateador unificado, menor consumo de CPU | Ambos activos, adopción empresarial creciente |
| Bundler basado en Rust | Rspack/Turbopack reemplazan Webpack — build incremental drásticamente más rápido | Activos, en adopción por Next.js y otros frameworks |
| Locks distribuidos | `redlock` sobre Redis, o `ioredis` con patrón `SET NX PX` | Activo |

## Bases de Datos (transversal)
| Área | Recomendación |
|---|---|
| Aislamiento de transacciones | `READ COMMITTED` por defecto; `SERIALIZABLE` solo donde el negocio lo exija (evita write skew y phantom reads) |
| Drivers | Siempre oficiales, con TLS obligatorio y `pool_pre_ping`/`connectionTimeoutMillis` configurados |
| Índices | Validar con `EXPLAIN ANALYZE` en staging antes de producción; monitorear con `pg_stat_statements` |
| Locks distribuidos | Basados en quorum (Redis Cluster, etcd, ZooKeeper) para evitar split-brain |

---

*Documento generado como referencia técnica de nivel profesional senior. Última actualización: septiembre 2026.*
