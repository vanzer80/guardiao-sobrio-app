import {
  getDiaPrograma,
  getDiasPrograma,
  getDiaStatus,
  calcularProgresso,
} from '../lib/programa30dias';

describe('getDiaPrograma', () => {
  it('dia 1 retorna dados válidos', () => {
    const dia = getDiaPrograma(1);
    expect(dia.dia).toBe(1);
    expect(dia.fundamento).toBeDefined();
    expect(dia.protocolo.trim()).not.toBe('');
    expect(dia.prompt.trim()).not.toBe('');
  });

  it('dia 30 retorna dados válidos', () => {
    const dia = getDiaPrograma(30);
    expect(dia.dia).toBe(30);
    expect(dia.fundamento).toBeDefined();
  });

  it('dias 1 e 14 têm o mesmo fundamento (ciclo de 13)', () => {
    const d1 = getDiaPrograma(1);
    const d14 = getDiaPrograma(14);
    expect(d1.fundamento.id).toBe(d14.fundamento.id);
  });
});

describe('getDiasPrograma', () => {
  it('retorna exatamente 30 dias', () => {
    const dias = getDiasPrograma();
    expect(dias).toHaveLength(30);
  });

  it('dias são numerados de 1 a 30', () => {
    const dias = getDiasPrograma();
    dias.forEach((d, i) => {
      expect(d.dia).toBe(i + 1);
    });
  });

  it('todos os dias têm fundamento, protocolo e prompt preenchidos', () => {
    getDiasPrograma().forEach((d) => {
      expect(d.fundamento).toBeDefined();
      expect(d.protocolo.trim()).not.toBe('');
      expect(d.prompt.trim()).not.toBe('');
    });
  });
});

describe('getDiaStatus', () => {
  it('dia 1 está disponível mesmo sem nenhum dia completo', () => {
    expect(getDiaStatus(1, new Set())).toBe('available');
  });

  it('dia 2 está bloqueado se dia 1 não foi completado', () => {
    expect(getDiaStatus(2, new Set())).toBe('locked');
  });

  it('dia 2 está disponível depois do dia 1 completado', () => {
    expect(getDiaStatus(2, new Set([1]))).toBe('available');
  });

  it('dia já completado retorna "completed"', () => {
    expect(getDiaStatus(1, new Set([1]))).toBe('completed');
    expect(getDiaStatus(5, new Set([1, 2, 3, 4, 5]))).toBe('completed');
  });

  it('dia 15 bloqueado sem dias anteriores', () => {
    expect(getDiaStatus(15, new Set([1, 2, 3]))).toBe('locked');
  });

  it('dia 30 bloqueado até dia 29 completo', () => {
    const todos = new Set(Array.from({ length: 29 }, (_, i) => i + 1));
    expect(getDiaStatus(30, todos)).toBe('available');
    expect(getDiaStatus(30, new Set())).toBe('locked');
  });
});

describe('calcularProgresso', () => {
  it('0 dias completos = 0%', () => {
    const p = calcularProgresso(new Set());
    expect(p.completados).toBe(0);
    expect(p.percentual).toBe(0);
    expect(p.certificadoDisponivel).toBe(false);
  });

  it('15 dias completos = 50%', () => {
    const p = calcularProgresso(new Set(Array.from({ length: 15 }, (_, i) => i + 1)));
    expect(p.completados).toBe(15);
    expect(p.percentual).toBe(50);
    expect(p.certificadoDisponivel).toBe(false);
  });

  it('30 dias completos = 100% + certificado disponível', () => {
    const p = calcularProgresso(new Set(Array.from({ length: 30 }, (_, i) => i + 1)));
    expect(p.completados).toBe(30);
    expect(p.percentual).toBe(100);
    expect(p.certificadoDisponivel).toBe(true);
  });
});
