/* "Notas técnicas" window: a showcase of docs/guias/concurrencia-y-acceso-a-datos.md (the full guide stays on
   GitHub). Excerpts are copied from the guide; English twins in `…En` fields. */

export const GUIDE_URL = "https://github.com/maximiliano-andres/new_porfolio/blob/main/docs/guias/concurrencia-y-acceso-a-datos.md";

export const GUIDE = {
  title: "Concurrencia, seguridad temporal y anti-patrones de acceso a datos",
  titleEn: "Concurrency, temporal safety and data-access anti-patterns",
  summary: "Guía de referencia que escribí para backend empresarial: cada problema con su definición y ejemplos vulnerables y corregidos en Java, Python y Node.js, más recomendaciones por stack.",
  summaryEn: "A reference guide I wrote for enterprise backends: each problem with its definition and vulnerable vs. fixed examples in Java, Python and Node.js, plus recommendations per stack.",
  stats: [
    { value: "43", label: "problemas documentados", labelEn: "documented problems" },
    { value: "3", label: "lenguajes por problema", labelEn: "languages per problem" },
    { value: "2.300+", valueEn: "2,300+", label: "líneas de guía", labelEn: "lines of guide" },
  ],
  parts: [
    {
      title: "Concurrencia, memoria y seguridad temporal",
      titleEn: "Concurrency, memory and temporal safety",
      topics: ["TOCTOU", "Race condition", "Data race", "Deadlock", "Livelock", "Starvation", "Priority inversion", "ABA problem",
        "Use-after-free", "Double-free", "Dangling pointer", "Memory leak", "Buffer overflow", "Atomicity violation", "Order violation",
        "Lost update", "Dirty read", "Non-repeatable read", "Phantom read", "Write skew", "Confused deputy", "Lock convoy",
        "Thundering herd", "Split-brain", "Distributed race condition", "Idempotency violation"],
    },
    {
      title: "Anti-patrones de acceso a datos y rendimiento",
      titleEn: "Data-access and performance anti-patterns",
      topics: ["N+1 query", "Cartesian product explosion", "SELECT N+1 en serialización", "Over-fetching", "Under-fetching",
        "Chatty API / I/O", "Missing index", "Implicit type conversion", "Cartesian join", "Connection pool exhaustion",
        "Lazy initialization exception", "Slow query / plan regression", "Cache stampede", "Hot partition / hot key",
        "Pagination offset", "Unbounded result set", "Blocking I/O in loop"],
    },
  ],
};

/* three entries of the guide, with the Python example exactly as written there */
export const HIGHLIGHTS = [
  {
    id: "blocking-io",
    title: "I/O bloqueante dentro de un loop",
    titleEn: "Blocking I/O inside a loop",
    definition: "Llamadas de red o disco ejecutadas una tras otra dentro de un loop: la latencia total se multiplica por el número de iteraciones en vez de aprovechar la concurrencia.",
    definitionEn: "Network or disk calls run one after another inside a loop: total latency is multiplied by the number of iterations instead of taking advantage of concurrency.",
    link: "Es el mismo principio detrás de la migración a BUK (de más de 1 hora a 5–10 minutos).",
    linkEn: "Same principle behind the BUK migration (from over 1 hour to 5–10 minutes).",
    code: `# VULNERABLE: secuencial con requests síncrono
results = [requests.get(f"/users/{id}").json() for id in user_ids]

# SEGURO: paralelizar con asyncio + httpx
async def fetch_all(user_ids):
    async with httpx.AsyncClient() as client:
        tasks = [client.get(f"/users/{id}") for id in user_ids]
        responses = await asyncio.gather(*tasks)
        return [r.json() for r in responses]`,
    codeEn: `# VULNERABLE: sequential, with synchronous requests
results = [requests.get(f"/users/{id}").json() for id in user_ids]

# SAFE: run in parallel with asyncio + httpx
async def fetch_all(user_ids):
    async with httpx.AsyncClient() as client:
        tasks = [client.get(f"/users/{id}") for id in user_ids]
        responses = await asyncio.gather(*tasks)
        return [r.json() for r in responses]`,
  },
  {
    id: "n-plus-one",
    title: "Problema N+1",
    titleEn: "The N+1 query problem",
    definition: "Una query trae N registros y luego se ejecutan N queries más, una por registro, para obtener sus datos relacionados.",
    definitionEn: "One query fetches N records, then N more queries run, one per record, to load their related data.",
    link: "Un clásico al acelerar consultas con SQLAlchemy.",
    linkEn: "A classic when speeding up queries with SQLAlchemy.",
    code: `# VULNERABLE
orders = session.query(Order).all()  # 1 query
for o in orders:
    print(o.customer.name)  # N queries

# SEGURO: selectinload
orders = session.query(Order).options(selectinload(Order.customer)).all()`,
    codeEn: `# VULNERABLE
orders = session.query(Order).all()  # 1 query
for o in orders:
    print(o.customer.name)  # N queries

# SAFE: selectinload
orders = session.query(Order).options(selectinload(Order.customer)).all()`,
  },
  {
    id: "lost-update",
    title: "Lost update",
    titleEn: "Lost update",
    definition: "Dos transacciones leen el mismo dato y ambas escriben a partir de él: la segunda sobrescribe a la primera y una actualización se pierde.",
    definitionEn: "Two transactions read the same value and both write based on it: the second overwrites the first and one update is lost.",
    link: "Clave en datos de nómina y finanzas, donde nada puede perderse.",
    linkEn: "Critical in payroll and finance data, where nothing can be lost.",
    code: `# SEGURO: version_id_col nativo de SQLAlchemy
class Product(Base):
    __tablename__ = 'products'
    id = Column(Integer, primary_key=True)
    stock = Column(Integer)
    version_id = Column(Integer, nullable=False, default=1)
    __mapper_args__ = {'version_id_col': version_id}`,
    codeEn: `# SAFE: SQLAlchemy's native version_id_col
class Product(Base):
    __tablename__ = 'products'
    id = Column(Integer, primary_key=True)
    stock = Column(Integer)
    version_id = Column(Integer, nullable=False, default=1)
    __mapper_args__ = {'version_id_col': version_id}`,
  },
];
