const { query } = require('./backend/src/infrastructure/database/connection');

function norm(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

async function findVmtOptions() {
  const coords = (await query(`
    SELECT id, dni, nombres_y_apellidos, distrito_asignado, distrito_donde_vota, local_de_votacion_asignado, local_de_votacion, credenciales, preguntas
    FROM rcoordinadores
    WHERE credenciales ILIKE '%confirmad%' AND preguntas ILIKE '%aprobad%'
  `)).rows.filter(u => norm(u.distrito_asignado).includes('villa maria') || norm(u.distrito_donde_vota).includes('villa maria'));

  const pers = (await query(`
    SELECT id, dni, nombres_y_apellidos, distrito_asignado, distrito_donde_vota, local_de_votacion_asignado, local_de_votacion, mesa_asignada, credenciales, preguntas
    FROM rpersoneros
    WHERE credenciales ILIKE '%confirmad%' AND preguntas ILIKE '%aprobad%'
  `)).rows.filter(u => norm(u.distrito_asignado).includes('villa maria') || norm(u.distrito_donde_vota).includes('villa maria'));

  console.log(`Coordinadores VMT: ${coords.length} | Personeros VMT: ${pers.length}`);

  const results = [];
  for (const c of coords) {
    const colC = c.local_de_votacion_asignado || c.local_de_votacion || '';
    const normColC = norm(colC);
    
    const matchingPers = pers.filter(p => {
      const colP = p.local_de_votacion_asignado || p.local_de_votacion || '';
      return norm(colP).includes(normColC) || normColC.includes(norm(colP)) || (normColC.length > 5 && norm(colP).slice(0, 15) === normColC.slice(0, 15));
    });

    if (matchingPers.length > 0) {
      results.push({
        colegio: colC,
        coordinador: {
          nombre: c.nombres_y_apellidos,
          dni: c.dni
        },
        personeros: matchingPers.map(p => ({
          nombre: p.nombres_y_apellidos,
          dni: p.dni,
          mesa: p.mesa_asignada || 'No aplica'
        }))
      });
    }
  }

  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
}

findVmtOptions();
