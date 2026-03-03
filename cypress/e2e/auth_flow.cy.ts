describe('TC-AUTH-08: Flujo de Autenticación Completo', () => {

  it('Debe iniciar sesión, elegir plan, saltar descarga y entrar al dashboard', () => {
    // 1. Login
    cy.visit('http://localhost:3000/login');
    cy.get('input[name="email"]').type('gerardoavilesmoreno28@gmail.com');
    cy.get('input[name="password"]').type('Preventa1');
    cy.contains('button', 'Ingresar').click();

    // 2. Selección de Plan
    cy.url().should('include', '/choose-plan', { timeout: 10000 });
    cy.contains('Plan Gratuito').parents().find('button').first().click();

    // 3. Pantalla de Descarga
    cy.url().should('include', '/download-app', { timeout: 10000 });

    // Usamos una expresión regular para encontrar el texto "Ir al panel"
    // sin importar mayúsculas o iconos internos
    cy.contains(/ir al panel/i, { timeout: 10000 })
      .should('be.visible')
      .click({ force: true }); // 'force' asegura el clic incluso si el icono estorba

    // 4. Resultado Esperado: Dashboard Final
    cy.url().should('include', '/dashboard', { timeout: 15000 });

    // Cambiamos la verificación por textos que SÍ aparecen en tu UI
    cy.contains('Accesos Rápidos').should('be.visible');
    cy.contains('Estado del Hato').should('be.visible');
    cy.contains('Mario Gerardo Aviles Moreno').should('be.visible'); // Tu nombre de usuario
  });
});
