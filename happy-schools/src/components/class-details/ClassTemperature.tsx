
interface ClassTemperatureProps {
    score: number; // 0-100
    label: string;
}

export default function ClassTemperature({ score, label }: ClassTemperatureProps) {
    // Calculate color based on score
    const getColor = (s: number) => {
        if (s >= 80) return '#22c55e'; // Green
        if (s >= 60) return '#f59e0b'; // Yellow
        return '#ef4444'; // Red
    };

    const color = getColor(score);

    return (
        <div style={{
            backgroundColor: 'white',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%'
        }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#6b7280', marginBottom: '16px' }}>
                {label}
            </h3>

            <div style={{ position: 'relative', width: '200px', height: '100px', overflow: 'hidden' }}>
                {/* Background Arc */}
                <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    width: '200px',
                    height: '200px',
                    borderRadius: '50%',
                    border: '20px solid #f3f4f6',
                    borderBottomColor: 'transparent',
                    borderLeftColor: 'transparent', // Make it semi clear? No, needs standard gauge look.
                    // Simplest CSS Gauge: box-sizing border-box
                    transform: 'rotate(135deg)', // Rotate to show top half
                }} />

                {/* Filled Arc - Using CLIP PATH or Conic Gradient is easier for dynamic */}
                <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    width: '200px',
                    height: '200px',
                    borderRadius: '50%',
                    background: `conic-gradient(from 225deg, ${color} ${score * 2.7}deg, transparent 0deg)`,
                    maskImage: 'radial-gradient(transparent 60%, black 61%)',
                    WebkitMaskImage: 'radial-gradient(transparent 60%, black 61%)',
                    transform: 'rotate(0deg)',
                    opacity: 0.9
                }} />

                {/* Needle (Optional, simpler to just show text) */}
                <div style={{
                    position: 'absolute',
                    bottom: '0',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    textAlign: 'center'
                }}>
                    <span style={{ fontSize: '36px', fontWeight: 800, color: color }}>{score}</span>
                    <span style={{ fontSize: '14px', color: '#9ca3af', marginLeft: '2px' }}>%</span>
                </div>
            </div>

            <p style={{ marginTop: '12px', fontSize: '14px', fontWeight: 500, color: color }}>
                {score >= 80 ? 'Rất Hào hứng' : score >= 60 ? 'Bình thường' : 'Cần chú ý'}
            </p>
        </div>
    );
}
