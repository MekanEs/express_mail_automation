export const ProcessFormInput = ({ value, setValue, points, min = 0 }: { value: number, setValue: (value: number) => void, points: number[], min?: number }) => {
    return (
        <div className='flex w-full gap-3'>
            <input
                className='border-2 border-gray-300 rounded-md p-2 w-1/4'
                type="number"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
            />
            <div className="mt-2 w-full">
                <input
                    type="range"
                    min={min}
                    max="100"
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500">
                    {points.map(point => (<span key={point}>{point}</span>))}
                </div>
            </div></div>
    )
}
