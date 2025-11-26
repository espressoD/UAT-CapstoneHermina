// src/pages/pagesPasien/StatusPasien.jsx

import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
	Activity,
	Bed,
	CheckCircle,
	ClipboardCheck,
	ClipboardList,
	Clock,
	FlaskRound,
	Info,
	Loader,
	Stethoscope,
	X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import PatientHeader from "../../components/layout/PatientHeader";
import SkeletonUI from "../../components/ui/SkeletonUI";
import HeaderSkeleton from "../../components/ui/HeaderSkeleton";
import { supabase } from "../../supabaseClient"; // Import supabase untuk realtime

function formatDuration(milliseconds) {
	if (milliseconds < 0 || !milliseconds) return "00:00:00";
	const totalSeconds = Math.floor(milliseconds / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const severityTextMap = {
	resusitasi: "RESUSITASI",
	emergency: "URGENT",
	semi: "SEMI-URGENT",
};

const stepConfigs = [
	{
		id: 1,
		title: "Pendaftaran & Pemeriksaan",
		subtitle: "Registration & Initial Check",
		icon: ClipboardCheck,
	},
	{
		id: 2,
		title: "Pemeriksaan Dokter IGD",
		subtitle: "ER Doctor Examination",
		icon: Stethoscope,
	},
	{
		id: 3,
		title: "Pemeriksaan Penunjang",
		subtitle: "Diagnostic Support",
		icon: FlaskRound,
	},
	{
		id: 4,
		title: "Tindakan & Pengobatan",
		subtitle: "Treatment / Therapy",
		icon: Activity,
	},
	{
		id: 5,
		title: "Keputusan Akhir Pasien",
		subtitle: "Patient Final Decision",
		icon: ClipboardList,
	},
	{
		id: 6,
		title: "Disposisi Ruangan",
		subtitle: "Room Disposition",
		icon: Bed,
	},
];

export default function StatusPasien() {
	const { idAntrian } = useParams();
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(true);
	const [selectedStep, setSelectedStep] = useState(null);
	const [activeTimer, setActiveTimer] = useState(0);
	const [totalTimer, setTotalTimer] = useState(0);
	const [kunjunganData, setKunjunganData] = useState(null);
	const [stepData, setStepData] = useState({});
	const [error, setError] = useState(null);

	// Fetch data kunjungan dari API
	useEffect(() => {
		const fetchKunjungan = async () => {
			try {
				setIsLoading(true);
				// idAntrian sekarang bisa berupa hash atau nomor antrian (backward compatible)
				const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
				const response = await fetch(
					`${API_URL}/api/public/status?q=${idAntrian}`
				);

				if (!response.ok) {
					// Redirect ke halaman error jika tidak ditemukan
					console.error('Kunjungan tidak ditemukan, redirecting...');
					navigate("/salah", { state: { attempted: idAntrian } });
					return;
				}

				const data = await response.json();
				setKunjunganData(data);
				setError(null);
			} catch (err) {
				console.error('Error fetching kunjungan:', err);
				// Redirect ke halaman error jika ada error jaringan
				navigate("/salah", { state: { attempted: idAntrian } });
			} finally {
				setIsLoading(false);
			}
		};

		if (idAntrian) {
			fetchKunjungan();
		}
	}, [idAntrian]); // navigate tidak perlu di dependency karena stabil

	// Setup Supabase Realtime subscription untuk auto-update
	useEffect(() => {
		if (!kunjunganData?.id) return;

		console.log('Setting up realtime subscription for kunjungan:', kunjunganData.id);

		// Fungsi untuk fetch data terbaru
		const fetchLatestData = async () => {
			try {
				console.log('Fetching latest data...');
				const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
				const response = await fetch(
					`${API_URL}/api/public/status?q=${idAntrian}`
				);
				if (response.ok) {
					const data = await response.json();
					console.log('Latest data received:', data.current_step);
					setKunjunganData(data);
				} else {
					console.warn('Failed to fetch latest data, status:', response.status);
				}
			} catch (err) {
				console.error('Error fetching latest data:', err);
				// Jangan redirect di sini, biarkan data yang ada tetap ditampilkan
			}
		};

		// Setup realtime subscription
		const channel = supabase
			.channel(`kunjungan-${kunjunganData.id}-changes`)
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'kunjungan',
					filter: `id=eq.${kunjunganData.id}`,
				},
				(payload) => {
					console.log('Realtime update detected:', payload);
					fetchLatestData();
				}
			)
			.subscribe((status) => {
				console.log('Realtime subscription status:', status);
			});

		// Fallback: Polling setiap 3 detik untuk memastikan data tetap update
		console.log('Starting polling interval...');
		const pollingInterval = setInterval(() => {
			console.log('Polling triggered at:', new Date().toLocaleTimeString());
			fetchLatestData();
		}, 3000);

		return () => {
			console.log('Cleaning up realtime subscription and polling');
			clearInterval(pollingInterval);
			supabase.removeChannel(channel);
		};
	}, [kunjunganData?.id, idAntrian]);

	// Generate stepData dari step_timestamps
	useEffect(() => {
		if (!kunjunganData) return;

		const timestampsFromDb = kunjunganData.step_timestamps || {};
		const currentStep = kunjunganData.current_step || 1;
		let newStepData = {};
		let lastEndTime = new Date(kunjunganData.created_at);

		for (let i = 1; i <= 6; i++) {
			const stepKey = `tahap_${i}`;
			const dbData = timestampsFromDb[stepKey];

			if (dbData && dbData.start_time) {
				newStepData[i] = {
					status: dbData.status || (dbData.end_time ? "completed" : "in_progress"),
					startTime: new Date(dbData.start_time),
					endTime: dbData.end_time ? new Date(dbData.end_time) : null,
				};
				lastEndTime = dbData.end_time ? new Date(dbData.end_time) : new Date(dbData.start_time);
			} else {
				if (i === currentStep) {
					newStepData[i] = { status: "in_progress", startTime: lastEndTime, endTime: null };
				} else if (i < currentStep) {
					newStepData[i] = { status: "completed", startTime: lastEndTime, endTime: lastEndTime };
				} else {
					newStepData[i] = { status: "pending", startTime: null, endTime: null };
				}
			}
		}

		if (currentStep === 1 && !timestampsFromDb["tahap_1"]) {
			newStepData[1] = { status: "in_progress", startTime: new Date(kunjunganData.created_at), endTime: null };
		}

		setStepData(newStepData);
	}, [kunjunganData]);

	// Build steps array dari stepData
	const steps = useMemo(() => {
		if (!kunjunganData || !stepData) return [];

		return stepConfigs.map((config, index) => {
			const stepNumber = index + 1;
			const data = stepData[stepNumber];
			
			if (!data) return { ...config, status: 'pending', description: { items: [] } };

			const formatTime = (date) => {
				if (!date) return null;
				return new Date(date).toLocaleTimeString("id-ID", {
					hour: '2-digit',
					minute: '2-digit',
					timeZone: 'Asia/Jakarta'
				});
			};

			// Build description items berdasarkan step
			let descriptionItems = [];
			
			if (stepNumber === 1) {
				descriptionItems = [
					{ 
						label: "Status", 
						value: data.status === 'completed' 
							? "Pendaftaran dan Pemeriksaan Triase sudah dilakukan"
							: data.status === 'in_progress'
							? "Sedang melakukan pendaftaran dan triase"
							: "Menunggu pendaftaran"
					},
					...(kunjunganData.perawat ? [{ label: "Perawat yang Melakukan Triase", value: kunjunganData.perawat }] : []),
					...(kunjunganData.gp ? [{ label: "Dokter IGD", value: kunjunganData.gp }] : []),
					...(kunjunganData.triase ? [{ 
						label: "Hasil Triase", 
						value: severityTextMap[kunjunganData.triase] || kunjunganData.triase.toUpperCase()
					}] : []),
				];
			} else if (stepNumber === 2) {
				descriptionItems = [
					{ 
						label: "Status", 
						value: data.status === 'completed' 
							? "Pemeriksaan oleh Dokter IGD Sudah Selesai."
							: data.status === 'in_progress'
							? "Dokter IGD sedang memeriksa pasien"
							: "Menunggu pemeriksaan dokter"
					},
					...(kunjunganData.gp ? [{ label: "Dokter IGD", value: kunjunganData.gp }] : []),
				];
			} else if (stepNumber === 3) {
				const isPenunjangSkipped = kunjunganData.pemeriksaan_penunjang?.skip;
				descriptionItems = [
					{ 
						label: "Status", 
						value: data.status === 'completed' 
							? (isPenunjangSkipped ? "Pasien tidak melakukan pemeriksaan penunjang" : "Pasien sudah melakukan pemeriksaan penunjang.")
							: data.status === 'in_progress'
							? "Sedang melakukan pemeriksaan penunjang"
							: "Menunggu pemeriksaan penunjang"
					},
					...(!isPenunjangSkipped ? [{ label: "Laboratorium", value: "Unit Penunjang Hermina" }] : []),
				];
			} else if (stepNumber === 4) {
				descriptionItems = [
					{ 
						label: "Status", 
						value: data.status === 'completed' 
							? "Tindakan & Pengobatan sudah diberikan kepada pasien."
							: data.status === 'in_progress'
							? "Sedang memberikan tindakan dan pengobatan"
							: "Menunggu tindakan dan pengobatan"
					},
				];
			} else if (stepNumber === 5) {
				const finalDecision = kunjunganData.keputusan_akhir;
				descriptionItems = [
					{ 
						label: "Status", 
						value: data.status === 'completed' 
							? "Keputusan akhir pasien sudah dibuat."
							: data.status === 'in_progress'
							? "Menentukan keputusan akhir pasien"
							: "Menunggu keputusan akhir"
					},
					...(kunjunganData.dpjp ? [{ label: "Dokter DPJP", value: kunjunganData.dpjp }] : []),
					...(finalDecision ? [{ 
						label: "Keputusan Akhir", 
						value: finalDecision === 'rawat' ? 'RAWAT INAP' 
							: finalDecision === 'rawat_jalan' ? 'RAWAT JALAN'
							: finalDecision === 'meninggal' ? 'MENINGGAL'
							: finalDecision.toUpperCase()
					}] : []),
				];
			} else if (stepNumber === 6) {
				descriptionItems = [
					{ 
						label: "Status", 
						value: data.status === 'completed' 
							? "Pasien sudah ditempatkan di ruangan."
							: data.status === 'in_progress'
							? "Tim sedang menyiapkan kamar rawat inap sesuai kebutuhan."
							: "Menunggu disposisi ruangan"
					},
					...(kunjunganData.disposisi_ruangan ? [{ label: "Ruangan", value: kunjunganData.disposisi_ruangan }] : []),
				];
			}

			return {
				...config,
				time: formatTime(data.startTime),
				done: formatTime(data.endTime),
				status: data.status,
				finalDecision: stepNumber === 5 ? kunjunganData.keputusan_akhir : null,
				description: { items: descriptionItems },
				startTime: data.startTime,
				endTime: data.endTime,
			};
		});
	}, [kunjunganData, stepData]);

	const activeStep = steps.find((step) => step.status === "in_progress");
	const completedSteps = steps.filter((step) => step.status === "completed").length;
	const currentStepNumber = activeStep ? activeStep.id : completedSteps;
	const progressPercentage = Math.round((completedSteps / steps.length) * 100);
	const nextStep = useMemo(() => steps.find((step) => step.status === "pending"), [steps]);

	useEffect(() => {
		let interval = null;
		if (activeStep?.startTime) {
			const startTime = new Date(activeStep.startTime);
			if (startTime) {
				interval = setInterval(() => {
					const now = new Date();
					setActiveTimer(Math.floor((now.getTime() - startTime.getTime()) / 1000));
				}, 1000);
			}
		}
		return () => {
			if (interval) clearInterval(interval);
		};
	}, [activeStep]);

	// Update total timer setiap detik - jumlahkan durasi semua tahapan
	useEffect(() => {
		if (!stepData || Object.keys(stepData).length === 0) return;
		
		const updateTotalTimer = () => {
			let totalSeconds = 0;
			const now = new Date();
			
			// Loop semua step dan jumlahkan durasinya
			for (let i = 1; i <= 6; i++) {
				const step = stepData[i];
				if (!step || !step.startTime) continue;
				
				if (step.status === 'completed' && step.endTime) {
					// Step selesai: hitung dari startTime ke endTime
					const duration = new Date(step.endTime).getTime() - new Date(step.startTime).getTime();
					totalSeconds += Math.floor(duration / 1000);
				} else if (step.status === 'in_progress') {
					// Step sedang berjalan: hitung dari startTime sampai sekarang
					const duration = now.getTime() - new Date(step.startTime).getTime();
					totalSeconds += Math.floor(duration / 1000);
				}
			}
			
			setTotalTimer(totalSeconds);
		};
		
		updateTotalTimer();
		const interval = setInterval(updateTotalTimer, 1000);
		
		return () => clearInterval(interval);
	}, [stepData]);

	const handleViewDetails = (step) => setSelectedStep(step);
	const handleClose = () => setSelectedStep(null);
	const activeDuration = activeStep ? formatDuration(activeTimer * 1000) : null;
	const totalDuration = formatDuration(totalTimer * 1000);

	const quickMetrics = useMemo(() => {
		if (!kunjunganData) return [];
		
		// Generate initial dari nama pasien
		const namaParts = kunjunganData.nama?.split(" ") || [];
		const initial = namaParts.length <= 3 
			? namaParts.map(n => n[0]).join(". ")
			: namaParts.slice(0, 3).map(n => n[0]).join(". ");

		return [
			{ label: "Nomor Antrian", value: kunjunganData.nomor_antrian || "-", description: "Queue Number" },
			{ label: "Inisial Pasien", value: initial || "-", description: "Patient Initial" },
		];
	}, [kunjunganData]);

	return (
		<>
			<div className="flex min-h-screen flex-col">
				<PatientHeader
					showBack
					backTo="/cek-antrian"
					rightSlot={
						<span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/80">
							<Activity size={14} className="text-[#FF8C00]" />
							Status Pasien IGD
						</span>
					}
				/>

				<main className="flex-1 pb-20">
				<section className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pt-10 md:px-12 md:pt-16">
					{isLoading ? (
						<HeaderSkeleton />
					) : error ? (
						<div className="text-center text-white py-10">
							<p className="text-xl font-semibold">Error: {error}</p>
							<p className="text-sm text-white/70 mt-2">Silakan coba lagi atau hubungi petugas</p>
						</div>
					) : (
							<>
								<div className="rounded-[32px] border border-white/12 bg-white/8 p-8 shadow-[0_28px_72px_-42px_rgba(0,76,44,0.35)] backdrop-blur-2xl">
									<div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
										<div className="space-y-8">
											<div>
												<p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/70">Patient Experience</p>
												<h1 className="mt-3 text-3xl font-semibold text-white">Hermina Pasteur • IGD Monitoring</h1>
												<p className="mt-2 text-sm text-white/65">
													Ikuti perjalanan pasien secara realtime dengan tampilan timeline modern dan informasi terkurasi.
												</p>
											</div>
											<div className="flex flex-col gap-4">
												{quickMetrics.map((metric) => (
													<div
														key={metric.label}
														className="group rounded-[26px] border border-white/12 bg-white/8 px-5 py-4 shadow-[0_18px_42px_-32px_rgba(0,76,44,0.28)] transition hover:border-white/18 hover:bg-white/12"
													>
														<p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/60">
															{metric.label}
														</p>
														<p className="mt-2 text-xl font-semibold tracking-tight text-white">{metric.value}</p>
														<p className="text-xs text-white/55">{metric.description}</p>
													</div>
												))}
											</div>
										</div>

										<div className="relative overflow-hidden rounded-[28px] border border-white/14 bg-gradient-to-br from-[#0B7A41] via-[#13A761] to-[#0A6B3C] p-6 text-white shadow-[0_22px_62px_-38px_rgba(6,104,57,0.28)]">
											<div className="absolute -right-16 top-16 h-56 w-56 rounded-full bg-[#4EE49A]/25 blur-[150px]" />
											<div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-[#0A5333]/45 blur-[150px]" />
											<div className="relative z-10 flex flex-col gap-6">
												<div className="flex items-center justify-between">
													<div>
														<p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/70">Progres Perawatan</p>
														<p className="mt-3 text-4xl font-semibold">{currentStepNumber}/{steps.length}</p>
														<p className="mt-2 text-xs text-white/60">
															{nextStep
																? `Langkah selanjutnya: ${nextStep.title}`
																: "Seluruh rangkaian IGD telah diselesaikan."}
														</p>
													</div>
													<div
														className="relative h-32 w-32 rounded-full bg-white/12 p-3"
														style={{
															background: `conic-gradient(#25D687 ${progressPercentage * 3.6}deg, rgba(255,255,255,0.14) 0deg)`
														}}
													>
														<div className="flex h-full w-full items-center justify-center rounded-full bg-[#092A18]">
															<span className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
																IGD
															</span>
														</div>
													</div>
												</div>
												{activeStep ? (
													<>
														<div className="rounded-2xl border border-white/18 bg-white/10 px-4 py-3 text-sm text-white/75">
															<p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/60">
																Tahap Aktif
															</p>
														<div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
															<div className="flex-1 min-w-0">
																<p className="text-base font-semibold text-white truncate">{activeStep.title}</p>
																<p className="text-xs text-white/60 truncate">{activeStep.subtitle}</p>
															</div>
													<span className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FF8C00] px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-md shrink-0">
														<Loader size={14} className="animate-spin-slow text-white" />
														<span className="truncate">{activeDuration ?? "Sedang disiapkan"}</span>
													</span>
														</div>
														</div>
														<div className="rounded-2xl border border-white/18 bg-white/10 px-4 py-3 text-sm text-white/75">
															<p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/60">
																💡 Tips Menunggu
															</p>
															<ul className="mt-3 space-y-2 text-xs text-white/70">
																<li>• Pasien dapat beristirahat di ruang tunggu IGD</li>
																<li>• Keluarga dapat membeli makanan di kantin lt. 1</li>
																<li>• Toilet terdekat: Sebelah ruang perawat</li>
															</ul>
														</div>
													</>
												) : (
													<div className="rounded-2xl border border-white/18 bg-white/10 px-4 py-3 text-sm text-white/75">
														<p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/60">Status</p>
														<p className="mt-3 text-base font-semibold text-white">Seluruh tindakan IGD selesai</p>
														<p className="text-xs text-white/60">Menunggu administrasi lanjutan.</p>
													</div>
												)}
											</div>
										</div>
									</div>
								</div>

								<div className="flex flex-col gap-10">
									<div className="relative rounded-[36px] border border-white/10 bg-white/8 p-9 shadow-[0_28px_68px_-44px_rgba(0,76,44,0.32)] backdrop-blur-2xl">
										<div className="relative z-10">
											<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/12 pb-6">
												<div className="flex-1 min-w-0">
													<h2 className="text-xl sm:text-[26px] font-semibold text-white">Timeline Perawatan IGD</h2>
													<p className="mt-2 text-sm text-white/65">
														Pembaruan otomatis ketika masing-masing unit menyelesaikan tindakan.
													</p>
												</div>
												<span className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/65 shrink-0">
													<Clock size={14} />
													Realtime Sync
												</span>
											</div>

										<div className="mt-7 grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
												{steps.map((step) => {
													const isCompleted = step.status === "completed";
													const isActive = step.status === "in_progress";
													const isPending = step.status === "pending";

													return (
													<motion.article
														key={step.id}
														whileHover={{ translateY: isPending ? 0 : -3 }}
														className={`flex h-full flex-col rounded-[32px] border p-7 transition duration-300 backdrop-blur-xl ${
															isCompleted
																? "border-2 border-[#27DA87] bg-[#F0FFF6]/95 shadow-[0_22px_52px_-28px_rgba(3,176,96,0.3)]"
																: isActive
																? "border-2 border-[#FF8C00] bg-[#FFF4E6]/95 shadow-[0_22px_52px_-28px_rgba(255,140,0,0.24)]"
																: "border-2 border-white/25 bg-white/15 shadow-[0_22px_52px_-28px_rgba(255,255,255,0.1)]"
														}`}
													>
														<div className="flex items-start gap-5">
															<div
																className={`flex h-12 w-12 items-center justify-center rounded-full border text-white shadow-inner ${
																	isCompleted
																		? "border-[#037B48]/20 bg-gradient-to-br from-[#037B48] to-[#03B060]"
																	: isActive
																		? "border-[#FF8C00]/30 bg-gradient-to-br from-[#FF8C00] to-[#FF7700] text-white"
																		: "border-white/30 bg-white/20 text-white/80"
																}`}
																	>
																		<step.icon size={22} />
																	</div>

																<div className="flex-1 space-y-4">
												<div className="space-y-1.5">
													<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
													<span
														className={`text-[11px] font-semibold uppercase tracking-[0.38em] ${
															isCompleted
																? "text-[#1C5B38]/75"
															: isActive
																? "text-[#CC5500]/80"
																: "text-white/85"
														}`}
													>
														Langkah {step.id}
													</span>
														{step.finalDecision && (
															<span 
																className="rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white whitespace-nowrap"
																style={{
																	backgroundColor: 
																		step.finalDecision === "rawat_jalan" ? "#10B981" :
																		step.finalDecision === "rawat" ? "#FF6F00" :
																		step.finalDecision === "meninggal" ? "#000000" : "#6B7280"
																}}
															>
																{step.finalDecision === "rawat_jalan" ? "RAWAT JALAN" :
																 step.finalDecision === "rawat" ? "RAWAT INAP" :
																 step.finalDecision === "meninggal" ? "MENINGGAL" : ""}
															</span>
														)}
													</div>
													<p className="text-base sm:text-[19px] font-semibold text-[#052B17] break-words">{step.title}</p>
													<p className="text-sm sm:text-[15px] text-[#356C46] break-words">{step.subtitle}</p>
												</div>										<div className="space-y-2">
											<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 text-sm text-[#356C46]">
												<div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-[13px] uppercase tracking-[0.2em] sm:tracking-[0.28em] text-[#356C46]/80 flex-wrap">
													<span className="truncate">{step.time || "-"}</span>
													{step.done && (
														<>
															<span>•</span>
															<span className="truncate">Selesai {step.done}</span>
														</>
													)}
												</div>
														<div className="flex items-center gap-2.5">
														{isCompleted && step.startTime && step.endTime && (
															<span className="rounded-full bg-[#037B48]/12 px-2 sm:px-3 py-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[#045635] whitespace-nowrap">
																{formatDuration(new Date(step.endTime).getTime() - new Date(step.startTime).getTime())}
															</span>
													)}
												</div>
												</div>
											{isActive && (
												<div className="flex items-start">
													<span className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FF8C00] px-2 sm:px-3 py-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white shadow-md whitespace-nowrap">
														<Loader size={14} sm:size={16} className="animate-spin-slow text-white shrink-0" />
														<span className="truncate">{activeDuration ?? "Berjalan"}</span>
													</span>
												</div>
											)}
												</div>																	<button
																	onClick={() => handleViewDetails(step)}
																	disabled={isPending}
																	className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.32em] transition ${
																		isCompleted
																			? "border-[#037B48]/25 bg-[#037B48]/12 text-[#0C3820] hover:bg-[#037B48]/18"
																		: isActive
																			? "border-[#FF8C00] bg-[#FF8C00] text-white hover:bg-[#FF7700] shadow-md"
																		: "border-white/35 bg-white/15 text-white/85 hover:border-white/45 hover:text-white"
																	} ${isPending ? "cursor-not-allowed opacity-50" : ""}`}
																>
																	<Info size={16} />
																	Detail
																</button>
																</div>
															</div>
														</motion.article>
													);
												})}
											</div>
									</div>
								</div>

								<div className="grid gap-6 lg:grid-cols-2">
									<div className="rounded-[30px] border border-white/12 bg-white/8 p-7 shadow-[0_24px_60px_-40px_rgba(0,76,44,0.32)] backdrop-blur-2xl">
										<p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/60">Insight Cepat</p>
										<div className="mt-4 space-y-4 text-sm text-white/70">
											<div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-3 text-sm text-white/75">
												<p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/55">Durasi Total</p>
												<p className="mt-2 text-[26px] font-semibold text-white">{totalDuration}</p>
												<p className="text-xs text-white/55">Dari pendaftaran hingga saat ini.</p>
											</div>
												<div className="rounded-2xl border border-white/12 bg-white/10 p-4">
													<p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/55">Tahapan Selanjutnya</p>
													<p className="mt-2 text-sm text-white">
														{nextStep ? `${nextStep.title} • ${nextStep.subtitle}` : "Kartu tahapan akan menampilkan informasi."}
													</p>
													<p className="mt-1 text-xs text-white/55">
														Sistem akan melakukan update otomatis ketika tahapan sudah selesai.
													</p>
												</div>
												<div className="rounded-2xl border border-white/12 bg-white/10 p-4">
													<p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/55">Kontak Penting</p>
													<div className="mt-2 space-y-1 text-sm">
														<p className="text-white/80">Petugas IGD: <span className="font-semibold text-white">(022) 6072525</span></p>
													</div>
												</div>
											</div>
										</div>

										<div className="rounded-[30px] border border-white/12 bg-white/8 p-7 text-white shadow-[0_24px_60px_-40px_rgba(0,76,44,0.32)] backdrop-blur-2xl">
											<p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/60">Tips Navigasi</p>
											<ul className="mt-4 space-y-3 text-sm text-white/70">
												<li>• Klik setiap langkah untuk melihat detail tindakan, tim yang bertugas, serta catatan khusus.</li>
												<li>• Pantau warna garis waktu: hijau artinya selesai, kuning menandakan proses berjalan.</li>
												<li>• Gunakan tombol Hubungi Hermina Care bila membutuhkan pendampingan langsung.</li>
											</ul>
										</div>
									</div>
								</div>
							</>
						)}
					</section>
				</main>

				<footer className="border-t border-white/12 bg-white/8">
					<div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 text-xs text-white/70 md:flex-row md:items-center md:justify-between md:px-12">
						<span>© {new Date().getFullYear()} Rumah Sakit Hermina Pasteur • Patient Experience Center</span>
						<span>Keamanan data setara HIPAA • Enkripsi TLS 1.3</span>
					</div>
				</footer>
			</div>

			<AnimatePresence>
				{selectedStep && (
					<>
						<motion.div
							className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={handleClose}
						/>
						<motion.div
							className="fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col bg-gradient-to-b from-white to-[#F6FCF8] text-[#05351D] shadow-[0_0_90px_-22px_rgba(10,52,30,0.5)]"
							initial={{ x: "100%" }}
							animate={{ x: 0 }}
							exit={{ x: "100%" }}
							transition={{ type: "spring", damping: 25, stiffness: 300 }}
						>
							<div className="flex items-start justify-between gap-4 border-b border-[#037B48]/18 px-6 py-5">
								<div className="flex items-start gap-3">
									<div className="rounded-xl border border-[#037B48]/18 bg-[#E6F6EB] p-3 text-[#1B4F31]">
										{selectedStep.icon && <selectedStep.icon size={28} />}
									</div>
									<div>
										<p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#1B4F31]">
											Langkah {selectedStep.id}
										</p>
										<h2 className="text-xl font-semibold text-[#052B17]">{selectedStep.title}</h2>
										<p className="text-sm text-[#2E6C47]">{selectedStep.subtitle}</p>
									</div>
								</div>
								<button onClick={handleClose} className="text-[#517663] transition hover:text-[#052B17]">
									<X size={22} />
								</button>
							</div>

							<div className="flex-1 space-y-5 px-6 py-6">
								<div className="flex items-center gap-3 rounded-2xl border border-[#037B48]/18 bg-[#E6F6EB] px-4 py-3 text-sm text-[#2B6E47]">
									{selectedStep.status === "completed" && (
										<>
											<CheckCircle size={18} className="text-[#037B48]" />
											<span className="rounded-full bg-[#03B060]/18 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#045635]">
												Selesai
											</span>
										</>
									)}
								{selectedStep.status === "in_progress" && (
									<>
										<Loader size={18} className="animate-spin-slow text-[#FF8C00]" />
										<span className="rounded-full bg-[#FF8C00] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white shadow-md">
											Sedang Berjalan
										</span>
									</>
								)}
									{selectedStep.status === "pending" && (
										<>
											<Clock size={18} className="text-[#7A8E84]" />
											<span className="rounded-full bg-[#EEF4F0] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#7A8E84]">
												Menunggu
											</span>
										</>
									)}
								</div>

								<div className="rounded-2xl border border-[#037B48]/18 bg-white p-4">
									<div className="mt-2 space-y-4 text-sm text-[#356C46]">
										{(selectedStep.description?.items ?? []).map((item, index) => (
											<div key={index}>
												<div className="mb-1.5 inline-flex items-center rounded-md bg-[#037B48]/6 px-2.5 py-1">
													<p className="text-xs font-bold uppercase tracking-[0.3em] text-[#037B48]">{item.label}</p>
												</div>
												{item.label === "Hasil Triase" ? (
													<div>
														<span 
															className="mt-2 inline-flex rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
															style={{
																backgroundColor: 
																	item.value === "RESUSITASI" ? "#EF4444" :
																	item.value === "URGENT" ? "#FBBF24" :
																	item.value === "SEMI-URGENT" ? "#10B981" : "#6B7280"
															}}
														>
															{item.value || "N/A"}
														</span>
													</div>
												) : item.label === "Keputusan Akhir" ? (
													<div>
														<span 
															className="mt-2 inline-flex rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
															style={{
																backgroundColor: 
																	item.value === "RAWAT JALAN" ? "#10B981" :
																	item.value === "RAWAT INAP" ? "#FF6F00" :
																	item.value === "MENINGGAL" ? "#000000" : "#6B7280"
															}}
														>
															{item.value || "N/A"}
														</span>
													</div>
												) : (
													<p className="mt-1 text-sm font-medium text-[#05351D]">{item.value}</p>
												)}
											</div>
										))}
									</div>
								</div>

								<div className="rounded-2xl border border-[#037B48]/18 bg-white p-4 text-sm text-[#2E6C47]">
									<p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#1C452A]">Waktu</p>
									<div className="mt-3 space-y-3">
										<div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
											<p className="text-xs sm:text-sm">Dimulai:</p>
											<span className="ml-0 sm:ml-2 font-semibold text-[#052B17] text-sm sm:text-base break-all">{selectedStep.time || "-"}</span>
										</div>
										{selectedStep.status === "completed" && (
											<>
												<div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
													<p className="text-xs sm:text-sm">Selesai:</p>
													<span className="ml-0 sm:ml-2 font-semibold text-[#052B17] text-sm sm:text-base break-all">{selectedStep.done || "-"}</span>
												</div>
												{(() => {
													const modalDuration = selectedStep.endTime && selectedStep.startTime
														? formatDuration(new Date(selectedStep.endTime).getTime() - new Date(selectedStep.startTime).getTime())
														: null;
													if (modalDuration) {
														return (
															<div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
																<p className="text-xs sm:text-sm">Durasi:</p>
																<span className="ml-0 sm:ml-2 font-semibold text-[#052B17] text-sm sm:text-base">{modalDuration}</span>
															</div>
														);
													}
													return null;
												})()}
											</>
										)}
									</div>
								</div>
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</>
	);
}

