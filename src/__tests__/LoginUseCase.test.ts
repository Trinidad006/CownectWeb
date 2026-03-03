import { LoginUseCase } from '../domain/use-cases/auth/LoginUseCase';

describe('LoginUseCase', () => {
  let loginUseCase: LoginUseCase;
  let mockAuthRepository: any;

  beforeEach(() => {
    // Creamos el mock del repositorio para Cownect
    mockAuthRepository = {
      login: jest.fn(),
    };
    loginUseCase = new LoginUseCase(mockAuthRepository);
  });

  test('debe retornar el usuario si las credenciales son correctas', async () => {
    const fakeUser = { id: 'user-001', email: 'admin@cownect.com' };
    
    // Simulamos una respuesta exitosa del repositorio
    mockAuthRepository.login.mockResolvedValue({ user: fakeUser, error: null });

    const result = await loginUseCase.execute({ 
      email: 'admin@cownect.com', 
      password: 'password123' 
    });

    expect(result.user).toEqual(fakeUser);
    expect(result.error).toBeNull();
  });

  test('debe retornar error si las credenciales son incorrectas', async () => {
    // Simulamos un error de autenticación
    mockAuthRepository.login.mockResolvedValue({ 
      user: null, 
      error: 'Credenciales inválidas' 
    });

    const result = await loginUseCase.execute({ 
      email: 'admin@cownect.com', 
      password: 'wrong-password' 
    });

    expect(result.error).toBe('Credenciales inválidas');
    expect(result.user).toBeNull();
  });
});