import { RegisterUseCase } from '../domain/use-cases/auth/RegisterUseCase';

describe('RegisterUseCase', () => {
  let registerUseCase: RegisterUseCase;
  let mockAuthRepository: any;

  beforeEach(() => {
    mockAuthRepository = { register: jest.fn() };
    registerUseCase = new RegisterUseCase(mockAuthRepository);
  });

  test('debe retornar error si la contraseña tiene menos de 6 caracteres', async () => {
    const result = await registerUseCase.execute({ email: 'test@cownect.com', password: '123' });
    expect(result.error).toBe('La contraseña debe tener al menos 6 caracteres');
    expect(result.user).toBeNull();
  });

  test('debe lanzar error "correo ya registrado" si el repositorio falla', async () => {
    mockAuthRepository.register.mockRejectedValue(new Error("correo ya registrado"));
    await expect(registerUseCase.execute({ email: 'repetido@cownect.com', password: 'password123' }))
      .rejects.toThrow("correo ya registrado");
  });

  test('debe registrar un usuario exitosamente', async () => {
    const fakeUser = { id: 'cow-123', email: 'vaca@cownect.com' };
    mockAuthRepository.register.mockResolvedValue({ user: fakeUser, error: null });
    const result = await registerUseCase.execute({ email: 'vaca@cownect.com', password: 'password123' });
    expect(result.user).toEqual(fakeUser);
  });
});