
-- DADOS SIMULADOS - CAMPANHA SIMULADA (final)

-- 1. MUNICÍPIOS
INSERT INTO municipios (campanha_id, nome, estado, populacao, meta_votos, prioridade, status, notes) VALUES
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Salvador', 'BA', 2886698, 45000, 'critica', 'ativo', 'Capital'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Feira de Santana', 'BA', 619609, 18000, 'critica', 'ativo', 'Segundo maior'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Vitória da Conquista', 'BA', 343230, 12000, 'alta', 'ativo', 'Polo sudoeste'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Camaçari', 'BA', 304302, 9000, 'alta', 'ativo', 'Polo industrial'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Juazeiro', 'BA', 262494, 8000, 'alta', 'ativo', 'São Francisco'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Itabuna', 'BA', 213223, 7500, 'media', 'ativo', 'Cacaueira'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Lauro de Freitas', 'BA', 204669, 6500, 'media', 'ativo', 'RMS'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Ilhéus', 'BA', 157639, 5000, 'media', 'ativo', 'Costa do Cacau'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Jequié', 'BA', 155966, 4800, 'media', 'ativo', 'Centro-sul'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Teixeira de Freitas', 'BA', 160487, 4500, 'media', 'ativo', 'Extremo sul'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Alagoinhas', 'BA', 155362, 4200, 'baixa', 'ativo', 'Agreste'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Porto Seguro', 'BA', 150658, 4000, 'baixa', 'ativo', 'Descobrimento'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Simões Filho', 'BA', 136672, 3500, 'baixa', 'ativo', 'RMS Industrial'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Paulo Afonso', 'BA', 120706, 3000, 'baixa', 'ativo', 'São Francisco'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Eunápolis', 'BA', 117879, 2800, 'baixa', 'ativo', 'Sul da Bahia')
ON CONFLICT DO NOTHING;

-- 2. APOIADORES
INSERT INTO supporters (campanha_id, nome, telefone, email, cidade, bairro, estado, endereco, cep, latitude, longitude, lideranca_politica, funcao_politica, observacao) VALUES
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Maria das Graças Santos', '71988001122', 'maria.gracas@email.com', 'Salvador', 'Pituba', 'BA', 'Rua Amazonas, 45', '41830-380', -12.9891, -38.4527, true, 'Vereadora', 'Zona sul'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'João Carlos Oliveira', '71988003344', NULL, 'Salvador', 'Liberdade', 'BA', 'Av. Lima e Silva, 120', '40325-010', -12.9431, -38.4937, false, NULL, 'Líder comunitário'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Ana Paula Souza', '71988005566', NULL, 'Salvador', 'Barra', 'BA', 'Rua Marquês de Leão, 88', '40140-070', -12.9967, -38.5234, false, NULL, 'Professora'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Roberto Almeida Lima', '71988007788', NULL, 'Salvador', 'Brotas', 'BA', 'Rua Waldemar Falcão, 250', '40295-010', -12.9855, -38.4801, true, 'Presidente de Associação', 'Moradores Brotas'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Claudia Ferreira', '71988009900', NULL, 'Salvador', 'Itapuã', 'BA', 'Rua Direta de Itapuã, 55', '41610-005', -12.9380, -38.3742, false, NULL, 'Comerciante'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Pedro Henrique Costa', '71988011122', NULL, 'Salvador', 'Cajazeiras', 'BA', NULL, '41330-000', -12.9147, -38.4195, false, NULL, 'Motorista'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Luciana Barbosa', '75988112233', NULL, 'Feira de Santana', 'Centro', 'BA', NULL, '44001-050', -12.2669, -38.9666, true, 'Prefeita', 'Prefeita'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Carlos Eduardo Silva', '75988334455', NULL, 'Feira de Santana', 'Tomba', 'BA', NULL, '44065-000', -12.2451, -38.9432, false, NULL, 'Empresário'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Fernanda Rocha', '75988556677', NULL, 'Feira de Santana', 'Cidade Nova', 'BA', NULL, NULL, -12.2789, -38.9801, false, NULL, 'Enfermeira'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Marcos Antônio Reis', '75988778899', NULL, 'Feira de Santana', 'Capuchinhos', 'BA', NULL, NULL, -12.2570, -38.9720, true, 'Vereador', 'Vereador atuante'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Patrícia Mendes', '77988001122', NULL, 'Vitória da Conquista', 'Brasil', 'BA', NULL, NULL, -14.8619, -40.8444, true, 'Secretária Municipal', 'Sec. Educação'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Antônio Jorge Neves', '77988223344', NULL, 'Vitória da Conquista', 'Candeias', 'BA', NULL, NULL, -14.8540, -40.8520, false, NULL, 'Advogado'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Sandra Regina Lima', '77988445566', NULL, 'Vitória da Conquista', 'Recreio', 'BA', NULL, NULL, -14.8680, -40.8380, false, NULL, 'Professora'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Ricardo Pereira', '71988221133', NULL, 'Camaçari', 'Centro', 'BA', NULL, NULL, -12.6996, -38.3263, false, NULL, 'Petrobrás'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Juliana Martins', '71988443355', NULL, 'Camaçari', 'Abrantes', 'BA', NULL, NULL, -12.7234, -38.2987, true, 'Vereadora', '2o mandato'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Francisco das Chagas', '74988112233', NULL, 'Juazeiro', 'Centro', 'BA', NULL, NULL, -9.4163, -40.5032, true, 'Presidente de Sindicato', 'Trabalhadores rurais'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Mariana Castro', '74988334455', NULL, 'Juazeiro', 'Alto da Maravilha', 'BA', NULL, NULL, -9.4230, -40.5100, false, NULL, 'Agricultora'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'José Raimundo Santos', '73988112233', NULL, 'Itabuna', 'Centro', 'BA', NULL, NULL, -14.7856, -39.2803, true, 'Vice-Prefeito', 'Vice-prefeito'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Renata Souza', '73988334455', NULL, 'Itabuna', 'Conceição', 'BA', NULL, NULL, -14.7912, -39.2750, false, NULL, 'Médica'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Adriana Gomes', '73988556677', NULL, 'Ilhéus', 'São Sebastião', 'BA', NULL, NULL, -14.7868, -39.0483, false, NULL, 'Guia turística'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Valdir Nascimento', '73988778899', NULL, 'Ilhéus', 'Pontal', 'BA', NULL, NULL, -14.8010, -39.0320, true, 'Presidente de Cooperativa', 'Pescadores'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Teresa Cristina Alves', '73988990011', NULL, 'Jequié', 'Centro', 'BA', NULL, NULL, -13.8569, -40.0838, false, NULL, 'Comerciante'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Osvaldo Pinheiro', '73988112244', NULL, 'Jequié', 'Joaquim Romão', 'BA', NULL, NULL, -13.8650, -40.0750, true, 'Vereador', 'Base forte'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Gabriela Nascimento', '71988665577', NULL, 'Lauro de Freitas', 'Vilas do Atlântico', 'BA', NULL, NULL, -12.8834, -38.3236, false, NULL, 'Empresária'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Lúcia Helena Santos', '73988553366', NULL, 'Teixeira de Freitas', 'Centro', 'BA', NULL, NULL, -17.5393, -39.7419, true, 'Prefeita', 'Boa aprovação'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Nilton César Oliveira', '75988113344', NULL, 'Alagoinhas', 'Barreiros', 'BA', NULL, NULL, -12.1420, -38.4150, true, 'Secretário de Saúde', 'Sec. municipal'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Camila Ferraz', '73988227788', NULL, 'Porto Seguro', 'Centro', 'BA', NULL, NULL, -16.4435, -39.0648, false, NULL, 'Hoteleira'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Davi Menezes', '73988449900', NULL, 'Porto Seguro', 'Arraial d''Ajuda', 'BA', NULL, NULL, -16.4870, -39.0720, true, 'Presidente de Associação', 'Assoc. comercial'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Edson Santos Lima', '75988889900', NULL, 'Paulo Afonso', 'Tancredo Neves', 'BA', NULL, NULL, -9.4130, -38.2200, true, 'Vereador', 'Veterano'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Sônia Maria Alves', '71988334466', NULL, 'Simões Filho', 'CIA', 'BA', NULL, NULL, -12.7868, -38.4013, false, NULL, 'Operária'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Gilberto Nascimento', '71988556688', NULL, 'Simões Filho', 'Centro', 'BA', NULL, NULL, -12.7830, -38.3950, true, 'Presidente de Sindicato', 'Metalúrgico'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Ivone Carvalho', '73988661122', NULL, 'Eunápolis', 'Centro', 'BA', NULL, NULL, -16.3778, -39.5802, false, NULL, 'Func. pública'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Helena Vieira', '77988112255', NULL, 'Ibotirama', 'Centro', 'BA', NULL, NULL, -12.1850, -43.2210, false, NULL, 'Pescadora'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Benedito Carvalho', '77988334477', NULL, 'Ibotirama', 'Beira Rio', 'BA', NULL, NULL, -12.1810, -43.2180, true, 'Vereador', 'Base forte');

-- 3. DESPESAS
INSERT INTO expenses (campanha_id, description, amount, category, payment_method, date) VALUES
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Impressão santinhos 500mil', 85000, 'material', 'transferencia', '2026-02-10'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Aluguel comitê Salvador', 12000, 'outros', 'transferencia', '2026-02-01'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Jingles e spots', 25000, 'publicidade', 'transferencia', '2026-02-15'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Combustível Fev', 8500, 'transporte', 'dinheiro', '2026-02-28'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Alimentação evento Feira', 3200, 'alimentacao', 'pix', '2026-02-20'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Bandeiras e faixas', 15000, 'material', 'transferencia', '2026-03-01'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Som para comícios', 6000, 'eventos', 'pix', '2026-03-02'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Redes sociais Mar', 18000, 'publicidade', 'transferencia', '2026-03-01'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Aluguel comitê Feira', 4500, 'outros', 'transferencia', '2026-03-01'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Assessoria jurídica', 20000, 'pessoal', 'transferencia', '2026-01-15'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Material escritório', 2800, 'material', 'pix', '2026-02-05'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Camisetas 5mil un', 35000, 'material', 'transferencia', '2026-02-25'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Combustível Mar', 9200, 'transporte', 'dinheiro', '2026-03-05'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Hospedagem interior', 7500, 'alimentacao', 'pix', '2026-03-03'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Vídeo institucional', 45000, 'publicidade', 'transferencia', '2026-01-20');

-- 4. RECEITAS
INSERT INTO revenues (campanha_id, description, amount, source, date, donor_name, donor_cpf_cnpj, notes) VALUES
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Fundo partidário P1', 250000, 'fundo_partidario', '2026-01-10', 'Partido 001', '00.000.001/0001-01', 'Parcela 1'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Doação Roberto Almeida', 10000, 'doacao', '2026-01-25', 'Roberto Almeida Lima', '123.456.789-00', NULL),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Fundo partidário P2', 250000, 'fundo_partidario', '2026-02-10', 'Partido 001', '00.000.001/0001-01', 'Parcela 2'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Doação Luciana Barbosa', 5000, 'doacao', '2026-02-15', 'Luciana Barbosa', '987.654.321-00', NULL),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Doação Construtora Bahia', 50000, 'doacao', '2026-02-20', 'Construtora Bahia Ltda', '12.345.678/0001-90', 'PJ'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'FEFC', 180000, 'fundo_especial', '2026-03-01', 'TSE', NULL, 'Fundo especial'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Doação Carlos Eduardo', 8000, 'doacao', '2026-03-05', 'Carlos Eduardo Silva', '111.222.333-44', NULL),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Jantar beneficente', 15000, 'evento', '2026-03-08', NULL, NULL, 'Salvador');

-- 5. ALOCAÇÕES (sem transporte)
INSERT INTO budget_allocations (budget_id, category, planned_amount) VALUES
('51f74929-be6b-49c2-8d5a-0c2cf3c373b3', 'publicidade', 200000),
('51f74929-be6b-49c2-8d5a-0c2cf3c373b3', 'material', 150000),
('51f74929-be6b-49c2-8d5a-0c2cf3c373b3', 'alimentacao', 30000),
('51f74929-be6b-49c2-8d5a-0c2cf3c373b3', 'eventos', 40000),
('51f74929-be6b-49c2-8d5a-0c2cf3c373b3', 'pessoal', 80000),
('51f74929-be6b-49c2-8d5a-0c2cf3c373b3', 'outros', 80000)
ON CONFLICT DO NOTHING;

-- 6. RUAS (status corretos)
INSERT INTO streets (campanha_id, nome, bairro, cidade, estado, status_cobertura, latitude, longitude) VALUES
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Av. Sete de Setembro', 'Centro', 'Salvador', 'BA', 'em_visitacao', -12.9714, -38.5124),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Rua Chile', 'Centro', 'Salvador', 'BA', 'concluida', -12.9739, -38.5108),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Av. ACM', 'Pituba', 'Salvador', 'BA', 'nao_visitada', -12.9850, -38.4500),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Av. Paralela', 'Imbuí', 'Salvador', 'BA', 'nao_visitada', -12.9400, -38.4100),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Rua Conselheiro Franco', 'Centro', 'Feira de Santana', 'BA', 'concluida', -12.2669, -38.9666),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Av. Presidente Dutra', 'Tomba', 'Feira de Santana', 'BA', 'em_visitacao', -12.2451, -38.9432),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Av. Bartolomeu de Gusmão', 'Brasil', 'Vitória da Conquista', 'BA', 'nao_visitada', -14.8619, -40.8444),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Av. Cinquentenário', 'Centro', 'Itabuna', 'BA', 'concluida', -14.7856, -39.2803),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Rua Jorge Amado', 'São Sebastião', 'Ilhéus', 'BA', 'em_visitacao', -14.7868, -39.0483),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Av. Conselheiro Saraiva', 'Centro', 'Juazeiro', 'BA', 'nao_visitada', -9.4163, -40.5032),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Av. Brasil', 'Centro', 'Eunápolis', 'BA', 'concluida', -16.3778, -39.5802),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Av. Apolônio Sales', 'Centro', 'Paulo Afonso', 'BA', 'nao_visitada', -9.4065, -38.2161);

-- 7. EVENTOS
INSERT INTO agenda_events (campanha_id, titulo, descricao, tipo, local, cidade, data_inicio, prioridade, status) VALUES
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Comício Centro Salvador', 'Grande comício Praça da Piedade', 'comicio', 'Praça da Piedade', 'Salvador', '2026-03-15 18:00:00-03', 'urgente', 'confirmado'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Reunião lideranças Feira', 'Alinhamento com vereadores', 'reuniao', 'Comitê Feira', 'Feira de Santana', '2026-03-12 10:00:00-03', 'alta', 'confirmado'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Caminhada Liberdade', 'Caminhada com militância', 'caminhada', 'Av. Lima e Silva', 'Salvador', '2026-03-18 08:00:00-03', 'normal', 'confirmado'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Visita Juazeiro', 'Líderes comunitários', 'visita', 'Diversos bairros', 'Juazeiro', '2026-03-20 09:00:00-03', 'alta', 'pendente'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Debate TV Bahia', 'Debate deputado federal', 'debate', 'TV Bahia', 'Salvador', '2026-03-25 20:00:00-03', 'urgente', 'confirmado'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Carreata V. Conquista', 'Carreata principais avenidas', 'carreata', 'Praça da Bandeira', 'Vitória da Conquista', '2026-03-22 14:00:00-03', 'alta', 'confirmado'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Corpo a corpo Itabuna', 'Panfletagem centro', 'corpo_a_corpo', 'Centro Comercial', 'Itabuna', '2026-03-19 07:00:00-03', 'normal', 'confirmado'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Prestação contas Fev', 'Reunião financeira', 'reuniao', 'Comitê Salvador', 'Salvador', '2026-03-10 15:00:00-03', 'normal', 'realizado'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Comício Camaçari', 'Com sindicalistas', 'comicio', 'Praça Central', 'Camaçari', '2026-03-28 18:00:00-03', 'alta', 'pendente'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Inauguração comitê Ilhéus', 'Abertura comitê sul', 'evento', 'Rua Jorge Amado', 'Ilhéus', '2026-03-16 10:00:00-03', 'normal', 'confirmado');

-- 8. MATERIAL
INSERT INTO material_inventory (campanha_id, tipo, cidade, descricao, quantidade_enviada, quantidade_reportada) VALUES
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Santinho', 'Salvador', 'Santinhos 10x15cm', 200000, 185000),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Santinho', 'Feira de Santana', 'Santinhos 10x15cm', 80000, 75000),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Bandeira', 'Salvador', 'Bandeiras 2x3m', 500, 480),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Camiseta', 'Salvador', 'Camisetas estampadas', 2000, 1850),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Adesivo', 'Salvador', 'Adesivos carro', 5000, 4200),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Santinho', 'Itabuna', 'Santinhos 10x15cm', 50000, 48000),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Santinho', 'Juazeiro', 'Santinhos 10x15cm', 40000, 38000),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Bandeira', 'Ilhéus', 'Bandeiras 1x2m', 150, 150),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 'Camiseta', 'Vitória da Conquista', 'Camisetas', 800, 780);

-- 9. ELEIÇÕES
INSERT INTO municipio_eleicoes (campanha_id, eleicao_ano, cargo, notes) VALUES
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 2022, 'Deputado Federal', 'Última eleição'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 2018, 'Deputado Federal', 'Eleição anterior'),
('277894b4-d06c-4e96-a4a1-53f45d4f97a9', 2020, 'Vereador', 'Municipais');
