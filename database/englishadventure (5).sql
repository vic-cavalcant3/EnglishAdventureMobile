-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 17/12/2025 às 20:13
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `englishadventure`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `cristais_conquistados`
--

CREATE TABLE `cristais_conquistados` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `cristal_tipo` varchar(50) NOT NULL COMMENT 'Ex: cristal_replay',
  `data_conquista` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `estrelas`
--

CREATE TABLE `estrelas` (
  `id` int(11) NOT NULL,
  `nomeAluno` varchar(100) NOT NULL,
  `atividade` varchar(100) DEFAULT NULL,
  `total_estrelas` int(11) DEFAULT 0,
  `acertou` int(11) NOT NULL,
  `dataRegistro` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `fases_jogadas`
--

CREATE TABLE `fases_jogadas` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `jogo` int(11) NOT NULL COMMENT '1=Learning, 2=Jogo2, 3=Jogo3, 4=Jogo4',
  `fase` int(11) NOT NULL COMMENT 'Número da fase (1-10)',
  `primeira_vez` timestamp NOT NULL DEFAULT current_timestamp(),
  `ultima_jogada` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `fase_estrelas`
--

CREATE TABLE `fase_estrelas` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `fase` int(11) NOT NULL,
  `estrelas` int(11) NOT NULL DEFAULT 0,
  `data_conquista` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `fase_estrelas2`
--

CREATE TABLE `fase_estrelas2` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `fase` int(11) NOT NULL,
  `estrelas` int(11) DEFAULT 0,
  `dataRegistro` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `fase_estrelas3`
--

CREATE TABLE `fase_estrelas3` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `fase` int(11) NOT NULL,
  `estrelas` int(11) DEFAULT 0,
  `dataRegistro` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `jogo`
--

CREATE TABLE `jogo` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `xp` int(11) DEFAULT 0,
  `estrelas` int(11) DEFAULT 0,
  `pagina_atual` int(11) DEFAULT 1,
  `fase_atual` int(11) DEFAULT 1,
  `xp_jogo3` int(11) DEFAULT 0,
  `xp_total` int(11) DEFAULT 0 COMMENT 'Soma do XP dos 3 jogos'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `progresso_detalhado`
--

CREATE TABLE `progresso_detalhado` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `nomeAluno` varchar(100) NOT NULL,
  `fase` int(11) NOT NULL,
  `atividade` varchar(100) NOT NULL,
  `tipo_gramatica` enum('afirmativa','interrogativa','negativa') NOT NULL,
  `tipo_habilidade` enum('speaking','reading','listening','writing','choice','writing') NOT NULL,
  `acertou` tinyint(1) DEFAULT 0,
  `tentativas` int(11) DEFAULT 1,
  `dataRegistro` timestamp NOT NULL DEFAULT current_timestamp(),
  `dataUltimaAtualizacao` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura stand-in para view `progresso_usuarios`
-- (Veja abaixo para a visão atual)
--
CREATE TABLE `progresso_usuarios` (
`nomeAluno` varchar(100)
,`atividades_completas` bigint(21)
,`total_acertos` decimal(32,0)
,`ultima_atividade` timestamp
);

-- --------------------------------------------------------

--
-- Estrutura para tabela `resumo_progresso`
--

CREATE TABLE `resumo_progresso` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `nomeAluno` varchar(100) NOT NULL,
  `afirmativa_total` int(11) DEFAULT 0,
  `afirmativa_acertos` int(11) DEFAULT 0,
  `interrogativa_total` int(11) DEFAULT 0,
  `interrogativa_acertos` int(11) DEFAULT 0,
  `negativa_total` int(11) DEFAULT 0,
  `negativa_acertos` int(11) DEFAULT 0,
  `speaking_total` int(11) DEFAULT 0,
  `speaking_acertos` int(11) DEFAULT 0,
  `reading_total` int(11) DEFAULT 0,
  `reading_acertos` int(11) DEFAULT 0,
  `listening_total` int(11) DEFAULT 0,
  `listening_acertos` int(11) DEFAULT 0,
  `writing_total` int(11) DEFAULT 0,
  `writing_acertos` int(11) DEFAULT 0,
  `choice_total` int(11) DEFAULT 0,
  `choice_acertos` int(11) DEFAULT 0,
  `dataAtualizacao` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `tokens_recuperacao`
--

CREATE TABLE `tokens_recuperacao` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `token` varchar(6) NOT NULL,
  `expiracao` datetime NOT NULL,
  `usado` tinyint(1) DEFAULT 0,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `data_cadastro` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `xp_jogo1`
--

CREATE TABLE `xp_jogo1` (
  `usuario_id` int(11) NOT NULL,
  `nomeAluno` varchar(100) DEFAULT NULL,
  `fase1_xp` int(11) DEFAULT 0,
  `fase2_xp` int(11) DEFAULT 0,
  `fase3_xp` int(11) DEFAULT 0,
  `fase4_xp` int(11) DEFAULT 0,
  `fase5_xp` int(11) DEFAULT 0,
  `fase6_xp` int(11) DEFAULT 0,
  `fase7_xp` int(11) DEFAULT 0,
  `fase8_xp` int(11) DEFAULT 0,
  `fase9_xp` int(11) DEFAULT 0,
  `fase10_xp` int(11) DEFAULT 0,
  `total_xp` int(11) DEFAULT 0,
  `dataRegistro` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `xp_jogo2`
--

CREATE TABLE `xp_jogo2` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `nomeAluno` varchar(100) NOT NULL,
  `fase1_xp` int(11) DEFAULT 0,
  `fase2_xp` int(11) DEFAULT 0,
  `fase3_xp` int(11) DEFAULT 0,
  `fase4_xp` int(11) DEFAULT 0,
  `fase5_xp` int(11) DEFAULT 0,
  `fase6_xp` int(11) DEFAULT 0,
  `fase7_xp` int(11) DEFAULT 0,
  `fase8_xp` int(11) DEFAULT 0,
  `fase9_xp` int(11) DEFAULT 0,
  `fase10_xp` int(11) DEFAULT 0,
  `total_xp` int(11) DEFAULT 0,
  `dataRegistro` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `xp_jogo3`
--

CREATE TABLE `xp_jogo3` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `nomeAluno` varchar(100) NOT NULL,
  `fase1_xp` int(11) DEFAULT 0,
  `fase2_xp` int(11) DEFAULT 0,
  `fase3_xp` int(11) DEFAULT 0,
  `fase4_xp` int(11) DEFAULT 0,
  `fase5_xp` int(11) DEFAULT 0,
  `fase6_xp` int(11) DEFAULT 0,
  `fase7_xp` int(11) DEFAULT 0,
  `fase8_xp` int(11) DEFAULT 0,
  `fase9_xp` int(11) NOT NULL,
  `fase10_xp` int(11) NOT NULL,
  `total_xp` int(11) DEFAULT 0,
  `dataRegistro` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para view `progresso_usuarios`
--
DROP TABLE IF EXISTS `progresso_usuarios`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `progresso_usuarios`  AS SELECT `estrelas`.`nomeAluno` AS `nomeAluno`, count(distinct `estrelas`.`atividade`) AS `atividades_completas`, sum(`estrelas`.`acertou`) AS `total_acertos`, max(`estrelas`.`dataRegistro`) AS `ultima_atividade` FROM `estrelas` GROUP BY `estrelas`.`nomeAluno` ;

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `cristais_conquistados`
--
ALTER TABLE `cristais_conquistados`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario_cristal` (`usuario_id`,`cristal_tipo`);

--
-- Índices de tabela `estrelas`
--
ALTER TABLE `estrelas`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `fases_jogadas`
--
ALTER TABLE `fases_jogadas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario_jogo_fase` (`usuario_id`,`jogo`,`fase`);

--
-- Índices de tabela `fase_estrelas`
--
ALTER TABLE `fase_estrelas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario_fase` (`usuario_id`,`fase`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Índices de tabela `fase_estrelas2`
--
ALTER TABLE `fase_estrelas2`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario_fase` (`usuario_id`,`fase`);

--
-- Índices de tabela `fase_estrelas3`
--
ALTER TABLE `fase_estrelas3`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario_id` (`usuario_id`,`fase`);

--
-- Índices de tabela `jogo`
--
ALTER TABLE `jogo`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `progresso_detalhado`
--
ALTER TABLE `progresso_detalhado`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario_atividade` (`usuario_id`,`atividade`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Índices de tabela `resumo_progresso`
--
ALTER TABLE `resumo_progresso`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario_id` (`usuario_id`);

--
-- Índices de tabela `tokens_recuperacao`
--
ALTER TABLE `tokens_recuperacao`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Índices de tabela `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Índices de tabela `xp_jogo1`
--
ALTER TABLE `xp_jogo1`
  ADD PRIMARY KEY (`usuario_id`);

--
-- Índices de tabela `xp_jogo2`
--
ALTER TABLE `xp_jogo2`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario_id` (`usuario_id`);

--
-- Índices de tabela `xp_jogo3`
--
ALTER TABLE `xp_jogo3`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_usuario` (`usuario_id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `cristais_conquistados`
--
ALTER TABLE `cristais_conquistados`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de tabela `estrelas`
--
ALTER TABLE `estrelas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=124;

--
-- AUTO_INCREMENT de tabela `fases_jogadas`
--
ALTER TABLE `fases_jogadas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=183;

--
-- AUTO_INCREMENT de tabela `fase_estrelas`
--
ALTER TABLE `fase_estrelas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- AUTO_INCREMENT de tabela `fase_estrelas2`
--
ALTER TABLE `fase_estrelas2`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT de tabela `fase_estrelas3`
--
ALTER TABLE `fase_estrelas3`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT de tabela `jogo`
--
ALTER TABLE `jogo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de tabela `progresso_detalhado`
--
ALTER TABLE `progresso_detalhado`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=146;

--
-- AUTO_INCREMENT de tabela `resumo_progresso`
--
ALTER TABLE `resumo_progresso`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=575;

--
-- AUTO_INCREMENT de tabela `tokens_recuperacao`
--
ALTER TABLE `tokens_recuperacao`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de tabela `xp_jogo2`
--
ALTER TABLE `xp_jogo2`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT de tabela `xp_jogo3`
--
ALTER TABLE `xp_jogo3`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `cristais_conquistados`
--
ALTER TABLE `cristais_conquistados`
  ADD CONSTRAINT `cristais_conquistados_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `fases_jogadas`
--
ALTER TABLE `fases_jogadas`
  ADD CONSTRAINT `fases_jogadas_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `fase_estrelas`
--
ALTER TABLE `fase_estrelas`
  ADD CONSTRAINT `fase_estrelas_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `fase_estrelas2`
--
ALTER TABLE `fase_estrelas2`
  ADD CONSTRAINT `fase_estrelas2_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `progresso_detalhado`
--
ALTER TABLE `progresso_detalhado`
  ADD CONSTRAINT `progresso_detalhado_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

--
-- Restrições para tabelas `resumo_progresso`
--
ALTER TABLE `resumo_progresso`
  ADD CONSTRAINT `resumo_progresso_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

--
-- Restrições para tabelas `tokens_recuperacao`
--
ALTER TABLE `tokens_recuperacao`
  ADD CONSTRAINT `tokens_recuperacao_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

--
-- Restrições para tabelas `xp_jogo1`
--
ALTER TABLE `xp_jogo1`
  ADD CONSTRAINT `xp_jogo1_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

--
-- Restrições para tabelas `xp_jogo2`
--
ALTER TABLE `xp_jogo2`
  ADD CONSTRAINT `xp_jogo2_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
