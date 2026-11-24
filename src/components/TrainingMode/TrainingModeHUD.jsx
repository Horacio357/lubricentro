import React, { useEffect, useState } from 'react';
import st from './TrainingModeHUD.module.css';

const DISMISS_STORAGE_KEY = 'rudy_training_launcher_dismissed';

const TrainingModeHUD = ({
	isActive,
	steps = [],
	currentIndex = 0,
	onStart,
	onExit,
	onNext,
	onPrev,
	onJumpTo,
	buttonLabel = 'Modo Entrenamiento',
}) => {
	const [isDismissed, setIsDismissed] = useState(false);

	useEffect(() => {
		try {
			if (window.sessionStorage.getItem(DISMISS_STORAGE_KEY) === 'true') {
				setIsDismissed(true);
			}
		} catch {
			// ignorar si sessionStorage no está disponible
		}
	}, []);

	useEffect(() => {
		if (!isActive) return;

		const handleKeyDown = (e) => {
			if (e.key === 'Escape') {
				onExit();
			} else if (e.key === 'ArrowRight') {
				onNext();
			} else if (e.key === 'ArrowLeft') {
				onPrev();
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [isActive, onExit, onNext, onPrev]);

	const handleDismissLauncher = (e) => {
		e.stopPropagation();
		setIsDismissed(true);
		try {
			window.sessionStorage.setItem(DISMISS_STORAGE_KEY, 'true');
		} catch {
			// ignorar
		}
	};

	if (!isActive) {
		if (isDismissed) return null;
		return (
			<div className={st.launcherGroup}>
				<button
					type="button"
					className={st.launcherBtn}
					onClick={onStart}
					title="Iniciar guía interactiva del sistema"
				>
					<span className={st.launcherDot} />
					<span>{buttonLabel}</span>
				</button>
				<button
					type="button"
					className={st.launcherCloseBtn}
					onClick={handleDismissLauncher}
					title="Ocultar botón de Modo Entrenamiento"
					aria-label="Ocultar botón de Modo Entrenamiento"
				>
					✕
				</button>
			</div>
		);
	}

	const step = steps[currentIndex];
	if (!step) return null;

	const total = steps.length;
	const progressPct = Math.round(((currentIndex + 1) / total) * 100);
	const isFirst = currentIndex === 0;
	const isLast = currentIndex === total - 1;

	return (
		<div className={st.hudWrapper} role="dialog" aria-label="Modo Entrenamiento">
			<div className={st.hudCard}>
				<div className={st.hudTopBar}>
					<div className={st.badgeGroup}>
						<span className={st.modeBadge}>MODO ENTRENAMIENTO</span>
						<span className={st.stepCounter}>
							Paso {currentIndex + 1} de {total}
						</span>
					</div>
					<button
						type="button"
						className={st.exitBtn}
						onClick={onExit}
						title="Salir del modo entrenamiento (ESC)"
					>
						Salir del entrenamiento (ESC) ✕
					</button>
				</div>

				<div className={st.progressTrack} aria-hidden="true">
					<div
						className={st.progressFill}
						style={{ width: `${progressPct}%` }}
					/>
				</div>

				<div className={st.hudBody}>
					<h4 className={st.stepTitle}>{step.title}</h4>
					<p className={st.stepDescription}>{step.description}</p>
					{step.tip && (
						<div className={st.tipBox}>
							<strong>Tip práctico:</strong> {step.tip}
						</div>
					)}
				</div>

				<div className={st.hudFooter}>
					<div className={st.dotsRow}>
						{steps.map((s, idx) => (
							<button
								key={s.id || idx}
								type="button"
								className={`${st.stepDot} ${
									idx === currentIndex ? st.stepDotActive : ''
								}`}
								onClick={() => onJumpTo && onJumpTo(idx)}
								aria-label={`Ir al paso ${idx + 1}: ${s.title}`}
								title={s.title}
							/>
						))}
					</div>

					<div className={st.navButtons}>
						<button
							type="button"
							className={st.prevBtn}
							onClick={onPrev}
							disabled={isFirst}
						>
							← Anterior
						</button>
						{isLast ? (
							<button
								type="button"
								className={st.finishBtn}
								onClick={onExit}
							>
								Finalizar entrenamiento ✓
							</button>
						) : (
							<button
								type="button"
								className={st.nextBtn}
								onClick={onNext}
							>
								Siguiente →
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default TrainingModeHUD;
