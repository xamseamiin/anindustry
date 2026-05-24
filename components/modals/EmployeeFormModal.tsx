'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus, X, Loader2, Info, User as UserIcon, Building, Mail, Phone, Tag,
    Briefcase as BriefcaseIcon, Calendar, Coins, ChevronRight
} from 'lucide-react';

interface EmployeeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newEmployee: any) => void;
    initialCategory?: 'COMPANY' | 'PROJECT';
}

export function EmployeeFormModal({ isOpen, onClose, onSuccess, initialCategory = 'COMPANY' }: EmployeeFormModalProps) {
    const [employeeType, setEmployeeType] = useState<'COMPANY' | 'PROJECT'>(initialCategory);

    // Common fields
    const [isActive, setIsActive] = useState(true);

    // Company Employee fields
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [companyRole, setCompanyRole] = useState('');
    const [monthlySalary, setMonthlySalary] = useState<number | ''>('');
    const [salaryStartDate, setSalaryStartDate] = useState(new Date().toISOString().split('T')[0]);

    // Project Employee fields
    const [projectList, setProjectList] = useState<{ id: string; name: string }[]>([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [projectEmployeeName, setProjectEmployeeName] = useState('');
    const [projectEmployeeEmail, setProjectEmployeeEmail] = useState('');
    const [projectEmployeePhone, setProjectEmployeePhone] = useState('');
    const [projectEmployeeRole, setProjectEmployeeRole] = useState('');
    const [projectStartDate, setProjectStartDate] = useState(new Date().toISOString().split('T')[0]);

    const [loading, setLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
    const [errorMessage, setErrorMessage] = useState('');

    const companyEmployeeRoles = ['Manager', 'Admin', 'HR', 'Accountant', 'Other'];
    const projectEmployeeRoles = ['Labor', 'Supervisor', 'Specialist', 'Other'];

    // Fetch projects when switching to PROJECT type
    useEffect(() => {
        if (employeeType === 'PROJECT' && projectList.length === 0) {
            fetch('/api/projects')
                .then(res => res.json())
                .then(data => setProjectList(data.projects || []))
                .catch(error => console.error('Error fetching projects:', error));
        }
    }, [employeeType, projectList.length]);

    // Reset form when closed
    useEffect(() => {
        if (!isOpen) {
            resetForm();
        }
    }, [isOpen]);

    const resetForm = () => {
        setFullName('');
        setEmail('');
        setPhone('');
        setCompanyRole('');
        setMonthlySalary('');
        setSalaryStartDate(new Date().toISOString().split('T')[0]);
        setProjectEmployeeName('');
        setProjectEmployeeEmail('');
        setProjectEmployeePhone('');
        setProjectEmployeeRole('');
        setProjectStartDate(new Date().toISOString().split('T')[0]);
        setSelectedProject('');
        setIsActive(true);
        setValidationErrors({});
        setErrorMessage('');
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (employeeType === 'COMPANY') {
            if (!fullName.trim()) newErrors.fullName = 'Magaca buuxa waa waajib.';
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Fadlan geli email sax ah.';
            if (!companyRole) newErrors.companyRole = 'Doorka shirkadda waa waajib.';
            if (!salaryStartDate) newErrors.salaryStartDate = 'Taariikhda bilowga mushaharka waa waajib.';
        } else if (employeeType === 'PROJECT') {
            if (!projectEmployeeName.trim()) newErrors.projectEmployeeName = 'Magaca buuxa waa waajib.';
            if (projectEmployeeEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(projectEmployeeEmail)) newErrors.projectEmployeeEmail = 'Fadlan geli email sax ah.';
            if (!projectEmployeeRole) newErrors.projectEmployeeRole = 'Doorka waa waajib.';
            if (!projectStartDate) newErrors.projectStartDate = 'Taariikhda bilowga shaqada waa waajib.';
        }

        setValidationErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setValidationErrors({});
        setErrorMessage('');

        console.log('[EmployeeFormModal] Starting employee submission...');

        if (!validateForm()) {
            console.log('[EmployeeFormModal] Validation failed');
            setLoading(false);
            setErrorMessage('Fadlan sax khaladaadka foomka.');
            return;
        }

        try {
            const payload = employeeType === 'COMPANY'
                ? {
                    fullName,
                    email: email || null,
                    phone: phone || null,
                    role: companyRole,
                    monthlySalary: monthlySalary || null,
                    isActive,
                    startDate: salaryStartDate,
                    category: 'COMPANY',
                }
                : {
                    fullName: projectEmployeeName,
                    email: projectEmployeeEmail || null,
                    phone: projectEmployeePhone || null,
                    role: projectEmployeeRole,
                    isActive,
                    startDate: projectStartDate,
                    category: 'PROJECT',
                    projectId: selectedProject || null,
                };

            console.log('[EmployeeFormModal] Sending payload:', { ...payload, category: payload.category });

            const response = await fetch('/api/projects/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            console.log('[EmployeeFormModal] API response status:', response.status);
            const data = await response.json();
            console.log('[EmployeeFormModal] API response data:', data);

            if (!response.ok) {
                if (response.status === 409) {
                    console.error('[EmployeeFormModal] Employee already exists');
                    setValidationErrors({ email: data.message });
                } else {
                    console.error('[EmployeeFormModal] API error:', response.status, data.message);
                    throw new Error(data.message || 'Failed to add employee');
                }
                return;
            }

            // Success!
            console.log('[EmployeeFormModal] Employee created successfully:', data.employee);
            onSuccess(data.employee);
            onClose();
            resetForm();
        } catch (error: any) {
            console.error('[EmployeeFormModal] Error creating employee:', error);
            setErrorMessage(error.message || 'Cilad shabakadeed ayaa dhacday. Fadlan isku day mar kale.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Blur Background Overlay */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
                    <h2 className="text-2xl font-bold text-darkGray dark:text-gray-100">Ku Dar Shaqaale Cusub</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Employee Type Selection */}
                    <div>
                        <label className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">
                            Nooca Shaqaalaha <span className="text-redError">*</span>
                        </label>
                        <div className="flex space-x-3">
                            <button
                                type="button"
                                onClick={() => setEmployeeType('COMPANY')}
                                className={`flex items-center space-x-2 p-3 rounded-lg border transition-all duration-200 ${employeeType === 'COMPANY'
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 border-lightGray dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                <Building size={20} /> <span>Shaqaalaha Shirkadda</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setEmployeeType('PROJECT')}
                                className={`flex items-center space-x-2 p-3 rounded-lg border transition-all duration-200 ${employeeType === 'PROJECT'
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 border-lightGray dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                <BriefcaseIcon size={20} /> <span>Shaqaalaha Mashruuca</span>
                            </button>
                        </div>
                    </div>

                    {/* Dynamic Fields */}
                    {employeeType === 'COMPANY' ? (
                        <div className="p-4 border border-primary/30 rounded-xl bg-primary/5 space-y-4">
                            <h3 className="text-lg font-bold text-primary">Shaqaalaha Shirkadda</h3>

                            {/* Full Name */}
                            <div>
                                <label htmlFor="fullName" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">
                                    Magaca Buuxa <span className="text-redError">*</span>
                                </label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        id="fullName"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Tusaale: Axmed Cali"
                                        className={`w-full p-2.5 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary ${validationErrors.fullName ? 'border-redError' : 'border-lightGray dark:border-gray-700'
                                            }`}
                                    />
                                </div>
                                {validationErrors.fullName && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="mr-1" />{validationErrors.fullName}</p>}
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">
                                    Email (Ikhtiyaari)
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="tusaale@ganacsi.com"
                                        className={`w-full p-2.5 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary ${validationErrors.email ? 'border-redError' : 'border-lightGray dark:border-gray-700'
                                            }`}
                                    />
                                </div>
                                {validationErrors.email && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="mr-1" />{validationErrors.email}</p>}
                            </div>

                            {/* Phone */}
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">
                                    Taleefan (Ikhtiyaari)
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={18} />
                                    <input
                                        type="tel"
                                        id="phone"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="251--------"
                                        className="w-full p-2.5 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            {/* Role */}
                            <div>
                                <label htmlFor="companyRole" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">
                                    Doorka Shirkadda <span className="text-redError">*</span>
                                </label>
                                <div className="relative">
                                    <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={18} />
                                    <select
                                        id="companyRole"
                                        value={companyRole}
                                        onChange={(e) => setCompanyRole(e.target.value)}
                                        className={`w-full p-2.5 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary ${validationErrors.companyRole ? 'border-redError' : 'border-lightGray dark:border-gray-700'
                                            }`}
                                    >
                                        <option value="">-- Dooro Door --</option>
                                        {companyEmployeeRoles.map(role => <option key={role} value={role}>{role}</option>)}
                                    </select>
                                    <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={18} />
                                </div>
                                {validationErrors.companyRole && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="mr-1" />{validationErrors.companyRole}</p>}
                            </div>

                            {/* Monthly Salary */}
                            <div>
                                <label htmlFor="monthlySalary" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">
                                    Mushahar Bil kasta (ETB) <span className="text-gray-400">(Ikhtiyaari)</span>
                                </label>
                                <div className="relative">
                                    <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={18} />
                                    <input
                                        type="number"
                                        id="monthlySalary"
                                        value={monthlySalary}
                                        onChange={(e) => setMonthlySalary(parseFloat(e.target.value) || '')}
                                        placeholder="Tusaale: 2500"
                                        className="w-full p-2.5 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            {/* Start Date */}
                            <div>
                                <label htmlFor="salaryStartDate" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">
                                    Taariikhda Bilowga Mushaharka <span className="text-redError">*</span>
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={18} />
                                    <input
                                        type="date"
                                        id="salaryStartDate"
                                        value={salaryStartDate}
                                        onChange={(e) => setSalaryStartDate(e.target.value)}
                                        className={`w-full p-2.5 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary ${validationErrors.salaryStartDate ? 'border-redError' : 'border-lightGray dark:border-gray-700'
                                            }`}
                                    />
                                </div>
                                {validationErrors.salaryStartDate && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="mr-1" />{validationErrors.salaryStartDate}</p>}
                            </div>

                            {/* Is Active */}
                            <div className="flex items-center justify-between p-3 bg-lightGray dark:bg-gray-700 rounded-lg border border-lightGray dark:border-gray-600">
                                <span className="text-darkGray dark:text-gray-300">Firfircoon</span>
                                <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                    className="h-5 w-5 text-primary rounded border-mediumGray dark:border-gray-600 focus:ring-primary"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 border border-accent/30 rounded-xl bg-accent/5 space-y-4">
                            <h3 className="text-lg font-bold text-accent">Shaqaalaha Mashruuca</h3>

                            {/* Project Selection (Optional) */}
                            <div>
                                <label htmlFor="selectedProject" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">
                                    Dooro Mashruuc <span className="text-gray-400">(Ikhtiyaari)</span>
                                </label>
                                <div className="relative">
                                    <BriefcaseIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={18} />
                                    <select
                                        id="selectedProject"
                                        value={selectedProject}
                                        onChange={(e) => setSelectedProject(e.target.value)}
                                        className="w-full p-2.5 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-accent"
                                    >
                                        <option value="">-- Dooro Mashruuc (Ikhtiyaari) --</option>
                                        {projectList.map(proj => <option key={proj.id} value={proj.id}>{proj.name}</option>)}
                                    </select>
                                    <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={18} />
                                </div>
                            </div>

                            {/* Full Name */}
                            <div>
                                <label htmlFor="projectEmployeeName" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">
                                    Magaca Buuxa <span className="text-redError">*</span>
                                </label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        id="projectEmployeeName"
                                        value={projectEmployeeName}
                                        onChange={(e) => setProjectEmployeeName(e.target.value)}
                                        placeholder="Tusaale: Axmed Cali"
                                        className={`w-full p-2.5 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-accent ${validationErrors.projectEmployeeName ? 'border-redError' : 'border-lightGray dark:border-gray-700'
                                            }`}
                                    />
                                </div>
                                {validationErrors.projectEmployeeName && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="mr-1" />{validationErrors.projectEmployeeName}</p>}
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="projectEmployeeEmail" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">
                                    Email <span className="text-gray-400">(Ikhtiyaari)</span>
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        id="projectEmployeeEmail"
                                        value={projectEmployeeEmail}
                                        onChange={(e) => setProjectEmployeeEmail(e.target.value)}
                                        placeholder="tusaale@ganacsi.com"
                                        className={`w-full p-2.5 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-accent ${validationErrors.projectEmployeeEmail ? 'border-redError' : 'border-lightGray dark:border-gray-700'
                                            }`}
                                    />
                                </div>
                                {validationErrors.projectEmployeeEmail && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="mr-1" />{validationErrors.projectEmployeeEmail}</p>}
                            </div>

                            {/* Phone */}
                            <div>
                                <label htmlFor="projectEmployeePhone" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">
                                    Taleefan <span className="text-gray-400">(Ikhtiyaari)</span>
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={18} />
                                    <input
                                        type="tel"
                                        id="projectEmployeePhone"
                                        value={projectEmployeePhone}
                                        onChange={(e) => setProjectEmployeePhone(e.target.value)}
                                        placeholder="251--------"
                                        className="w-full p-2.5 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent"
                                    />
                                </div>
                            </div>

                            {/* Role */}
                            <div>
                                <label htmlFor="projectEmployeeRole" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">
                                    Doorka <span className="text-redError">*</span>
                                </label>
                                <div className="relative">
                                    <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={18} />
                                    <select
                                        id="projectEmployeeRole"
                                        value={projectEmployeeRole}
                                        onChange={(e) => setProjectEmployeeRole(e.target.value)}
                                        className={`w-full p-2.5 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-accent ${validationErrors.projectEmployeeRole ? 'border-redError' : 'border-lightGray dark:border-gray-700'
                                            }`}
                                    >
                                        <option value="">-- Dooro Door --</option>
                                        {projectEmployeeRoles.map(role => <option key={role} value={role}>{role}</option>)}
                                    </select>
                                    <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={18} />
                                </div>
                                {validationErrors.projectEmployeeRole && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="mr-1" />{validationErrors.projectEmployeeRole}</p>}
                            </div>

                            {/* Start Date */}
                            <div>
                                <label htmlFor="projectStartDate" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">
                                    Taariikhda Bilowga Shaqada <span className="text-redError">*</span>
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={18} />
                                    <input
                                        type="date"
                                        id="projectStartDate"
                                        value={projectStartDate}
                                        onChange={(e) => setProjectStartDate(e.target.value)}
                                        className={`w-full p-2.5 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent ${validationErrors.projectStartDate ? 'border-redError' : 'border-lightGray dark:border-gray-700'
                                            }`}
                                    />
                                </div>
                                {validationErrors.projectStartDate && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="mr-1" />{validationErrors.projectStartDate}</p>}
                            </div>

                            {/* Is Active */}
                            <div className="flex items-center justify-between p-3 bg-lightGray dark:bg-gray-700 rounded-lg border border-lightGray dark:border-gray-600">
                                <span className="text-darkGray dark:text-gray-300">Firfircoon</span>
                                <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                    className="h-5 w-5 text-accent rounded border-mediumGray dark:border-gray-600 focus:ring-accent"
                                />
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {errorMessage && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-red-600 dark:text-red-400 text-sm flex items-center">
                                <Info size={16} className="mr-2" />
                                {errorMessage}
                            </p>
                        </div>
                    )}

                    {/* Submit Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 bg-gray-200 dark:bg-gray-700 text-darkGray dark:text-gray-100 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            Jooji
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 px-4 bg-primary text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {loading ? (
                                <><Loader2 className="animate-spin mr-2" size={18} /> Diiwaan Gelinaya...</>
                            ) : (
                                <><Plus className="mr-2" size={18} /> Diiwaan Geli Shaqaale</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
