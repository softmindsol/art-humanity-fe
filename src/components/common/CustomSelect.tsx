
import  { useState, useRef } from 'react';
import useOnClickOutside from '@/hook/useOnClickOutside'; // Aapke paas yeh hook pehle se hai
import { ChevronDown } from 'lucide-react';

interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
}

const CustomSelect = ({ options, value, onChange }: CustomSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);

    // Bahar click karne par dropdown band ho jaye
    useOnClickOutside([selectRef], () => {
        if (isOpen) {
            setIsOpen(false);
        }
    });

    // Jo option select ho, uska label dhoondein
    const selectedLabel = options.find(option => option.value === value)?.label;

    const handleOptionClick = (newValue: string) => {
        onChange(newValue); // State update karein
        setIsOpen(false);  // Dropdown band karein
    };

    return (
        <div ref={selectRef} className="relative w-full">
            {/* Yeh hamara naya select box hai */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="block w-full appearance-none text-left text-[12px] md:text-[14px] p-2 pr-8 border-[1px] border-[#ffffff] text-[#ffffff] rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-[#8b795e]"
            >
                {selectedLabel}

                {/* Custom Arrow */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#ffffff]">
                    <ChevronDown
                        size={16}
                        className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                </div>
            </button>

            {/* Yeh options ki list hai jo conditionally render hogi */}
            {isOpen && (
                <div className="absolute top-full mt-1 w-full z-10 bg-[#141414] border-[1px] border-[#ffffff] rounded-md shadow-lg py-1">
                    {options.map((option) => (
                        <div
                            key={option.value}
                            onClick={() => handleOptionClick(option.value)}
                            className={`px-3 py-2 text-[12px] md:text-[14px] text-[#ffffff] cursor-pointer hover:bg-[#E23373] ${value === option.value ? 'font-bold bg-[#E23373]' : ''}`}
                        >
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomSelect;