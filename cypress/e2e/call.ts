describe('call in', () => {
  it('should allow a typical user flow', () => {
    cy.visit('/')
    cy.findByRole('link', {name: /call kent/i}).click()
    cy.findByRole('heading', {name: /Call Kent Podcast/i})
    cy.findByRole('button', {name: /start/i}).click()
    cy.wait(500)
    cy.findByRole('button', {name: /pause/i}).click()
    cy.findByRole('button', {name: /resume/i}).click()
    cy.wait(500)
    cy.findByRole('button', {name: /stop/i}).click()
  })
})
