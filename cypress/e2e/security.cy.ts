describe('TC-PAY-06: Redirección de Seguridad', () => {

  it('Debe redirigir al login si se intenta entrar al dashboard sin sesión', () => {
    // 1. Intentar acceder sin token
    cy.visit('http://localhost:3000/dashboard');

    // Resultado Esperado: Redirección inmediata
    cy.url().should('include', '/login');
    cy.contains('Iniciar Sesión').should('be.visible');
  });
});

