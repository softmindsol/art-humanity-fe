import AdminDashboard from '@/components/forms/CreateProjectForm';

const CreateProjectPage = () => {
   


    return (
        <div className="min-h-screen">
            {/* <Button
                type="button"
                onClick={() => navigate(-1)} // or: navigate('/projects')
                className="absolute left-10 top-20 sm:top-36 inline-flex items-center gap-2
                   rounded-xl border border-gray-200 bg-white/80 backdrop-blur
                   px-3 py-2 text-[#5d4037] hover:text-[#3e2723] shadow-sm hover:shadow
                   transition cursor-pointer"
                aria-label="Go back"
            >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline ">Back</span>
            </Button> */}
            <div className="max-w-4xl mx-auto px-4">
                <AdminDashboard
                   
                />
            </div>
        </div>
    );
};

export default CreateProjectPage;