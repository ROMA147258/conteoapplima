const { query } = require('../src/infrastructure/database/connection');

async function seed() {
  try {
    console.log('--- Limpiando registros previos de prueba ---');
    await query(`
      DELETE FROM rpersoneros WHERE TRIM(dni) IN ('susan123', '80000001', '80000002', '80000003', '80000004');
    `);
    await query(`
      DELETE FROM rcoordinadores WHERE TRIM(dni) = 'susan456';
    `);

    // 1. Personero susan / susan123
    console.log('--- Creando cuenta Personero susan / susan123 ---');
    await query(`
      INSERT INTO rpersoneros (
        nombres_y_apellidos, dni, celular, correo_electronico,
        distrito_donde_vota, local_de_votacion, mesa_de_sufragio,
        rol_a_desempenar, distrito_asignado, local_de_votacion_asignado, mesa_asignada,
        preguntas, credenciales, token_verificacion, fecha_de_registro
      ) VALUES (
        'susan', 'susan123', '999888777', 'susan.personero@test.pe',
        'MIRAFLORES', 'IE 7001 ANDRES BELLO', '006613',
        'Personero', 'MIRAFLORES', 'IE 7001 ANDRES BELLO', '006613',
        'Aprobado', 'Confirmado', 'SP-TEST-SUSAN123', CURRENT_TIMESTAMP
      );
    `);

    // 2. Coordinador susan / susan456
    console.log('--- Creando cuenta Coordinador susan / susan456 ---');
    await query(`
      INSERT INTO rcoordinadores (
        nombres_y_apellidos, dni, celular, correo_electronico,
        distrito_donde_vota, local_de_votacion, mesa_de_sufragio,
        rol_a_desempenar, distrito_asignado, local_de_votacion_asignado, mesa_asignada,
        preguntas, credenciales, token_verificacion, fecha_de_registro
      ) VALUES (
        'susan', 'susan456', '999888776', 'susan.coordinador@test.pe',
        'MIRAFLORES', 'IE 7001 ANDRES BELLO', 'No aplica',
        'Coordinador de Local', 'MIRAFLORES', 'IE 7001 ANDRES BELLO', '',
        'Aprobado', 'Confirmado', 'SP-TEST-SUSAN456', CURRENT_TIMESTAMP
      );
    `);

    // 3. Personeros de prueba para el local del coordinador
    console.log('--- Creando personeros de prueba asignados al local ---');
    const personerosTest = [
      {
        nombre: 'Juan Perez Test',
        dni: '80000001',
        cel: '999111222',
        mesa: '006614'
      },
      {
        nombre: 'Maria Rodriguez Test',
        dni: '80000002',
        cel: '999222333',
        mesa: '006615'
      },
      {
        nombre: 'Carlos Mendoza Test',
        dni: '80000003',
        cel: '999333444',
        mesa: '006616'
      },
      {
        nombre: 'Ana Gomez Test',
        dni: '80000004',
        cel: '999444555',
        mesa: '006617'
      }
    ];

    for (const p of personerosTest) {
      await query(`
        INSERT INTO rpersoneros (
          nombres_y_apellidos, dni, celular, correo_electronico,
          distrito_donde_vota, local_de_votacion, mesa_de_sufragio,
          rol_a_desempenar, distrito_asignado, local_de_votacion_asignado, mesa_asignada,
          preguntas, credenciales, token_verificacion, fecha_de_registro
        ) VALUES (
          $1, $2, $3, 'test@elecciones.pe',
          'MIRAFLORES', 'IE 7001 ANDRES BELLO', $4,
          'Personero', 'MIRAFLORES', 'IE 7001 ANDRES BELLO', $4,
          'Aprobado', 'Confirmado', $5, CURRENT_TIMESTAMP
        )
      `, [p.nombre, p.dni, p.cel, p.mesa, 'SP-TEST-' + p.dni]);
    }

    console.log('✅ Cuentas y personeros de prueba insertados con éxito.');
    process.exit(0);
  } catch (e) {
    console.error('❌ Error ejecutando seed:', e);
    process.exit(1);
  }
}

seed();
