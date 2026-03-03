describe('TC-INV-06: Flujo Completo de Alta de Animal', () => {

  it('Debe completar todo el recorrido desde login hasta registro de animal', () => {
    // 1. Iniciar Sesión
    cy.visit('http://localhost:3000/login');
    cy.get('input[name="email"]').type('gerardoavilesmoreno28@gmail.com');
    cy.get('input[name="password"]').type('Preventa1');
    cy.contains('button', 'Ingresar').click();

    // 2. Selección de Plan (Paso obligatorio)
    cy.url().should('include', '/choose-plan', { timeout: 10000 });
    cy.contains('Plan Gratuito').parents().find('button').first().click();

    // 3. Saltar pantalla de descarga
    cy.url().should('include', '/download-app', { timeout: 10000 });
    cy.contains(/ir al panel/i).click({ force: true });

    // 4. Navegación a Gestión
    cy.url().should('include', '/dashboard', { timeout: 15000 });
    cy.contains('Gestión').click(); 

    // 5. Registro de Animal
    cy.contains('button', /agregar|nuevo/i).click(); // Ajusta según tu botón real
    
    const idSiniiga = `310${Math.floor(1000000 + Math.random() * 9000000)}`;
    cy.get('input[name="siniiga"]').type(idSiniiga);
    cy.get('input[name="nombre"]').type('Vaca E2E');
    cy.get('input[name="peso"]').type('400');
    
    cy.contains('button', /guardar|registrar/i).click();

    // Verificación final
    cy.contains(/exitoso|guardado/i).should('be.visible');
  });
});


