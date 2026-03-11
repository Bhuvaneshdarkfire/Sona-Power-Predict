import React from 'react';

const About: React.FC = () => {
    return (
        <div className="bg-white">
            {/* Header */}
            <section className="bg-gradient-to-br from-cream to-sky py-14">
                <div className="max-w-container mx-auto px-4 lg:px-8 text-center">
                    <h1 className="font-heading font-bold text-3xl lg:text-4xl text-slate mb-3">About the Event</h1>
                    <p className="text-gray-500 max-w-xl mx-auto">
                        National Level IPL PowerPlay Score Prediction Hackathon — Sona Gameathon 2026
                    </p>
                </div>
            </section>

            <div className="max-w-container mx-auto px-4 lg:px-8 py-14">
                {/* About Sona Power Predict */}
                <div className="mb-12">
                    <h2 className="section-heading text-2xl mb-4">About Sona Power Predict</h2>
                    <p className="text-gray-600 mb-5 max-w-3xl leading-relaxed">
                        Sona Power Predict is a national-level hackathon where cricket meets code. Teams build ML models to predict IPL PowerPlay scores.
                        The competition runs from <strong>March 28 to May 31, 2026</strong> with a <strong>prize pool of ₹2 Lakhs</strong> and <strong>no registration fee</strong>.
                    </p>
                </div>

                {/* How It Works */}
                <div className="mb-12">
                    <h2 className="section-heading text-2xl mb-6">How It Works</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {[
                            { num: '1', title: 'Register', desc: 'Sign up your team of up to 4 members via the registration form. No registration fee!' },
                            { num: '2', title: 'Build Model', desc: 'Train your ML algorithm on historical cricket data to predict match outcomes.' },
                            { num: '3', title: 'Submit', desc: 'Upload your mymodelfile.py as a .zip file through your team dashboard.' },
                            { num: '4', title: 'Compete', desc: 'Your model predicts runs for live matches. Lowest cumulative error wins.' },
                        ].map((s) => (
                            <div key={s.num} className="card p-6">
                                <div className="w-9 h-9 rounded-full bg-royal text-white flex items-center justify-center font-heading font-bold text-sm mb-3">
                                    {s.num}
                                </div>
                                <h3 className="font-heading font-semibold text-slate mb-1">{s.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Key Highlights */}
                <div className="mb-12">
                    <h2 className="section-heading text-2xl mb-6">Key Highlights</h2>
                    <div className="grid sm:grid-cols-3 gap-5">
                        {[
                            { icon: '🏆', title: 'Prize Pool: ₹2 Lakhs', desc: 'Exciting prizes for top performing teams.' },
                            { icon: '🆓', title: 'No Registration Fee', desc: 'Completely free to participate — open to all colleges.' },
                            { icon: '📈', title: 'Real-Time Leaderboard', desc: 'Live scoring and rankings after each match evaluation.' },
                        ].map((f) => (
                            <div key={f.title} className="card p-5">
                                <span className="text-2xl mb-3 block">{f.icon}</span>
                                <h4 className="font-heading font-semibold text-slate text-sm mb-1">{f.title}</h4>
                                <p className="text-gray-500 text-sm">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Convener, Co-Convener, Advisor */}
                <div className="mb-12">
                    <h2 className="section-heading text-2xl mb-6">Organizing Committee</h2>
                    <div className="grid sm:grid-cols-3 gap-5">
                        {[
                            { name: 'Dr. B Sathiyabhama', role: 'Convener', designation: 'Professor & Head, CSE, CSD & CSE(AIML)' },
                            { name: 'Dr. S. Sakthivel', role: 'Co-Convener', designation: 'Professor, Dept of CSE' },
                            { name: 'Dr. B. Saravanan', role: 'Advisor', designation: 'Placement Director, SCT' },
                        ].map((member) => (
                            <div key={member.name} className="card-static p-5 border-l-4 border-royal">
                                <p className="text-royal text-xs font-heading font-bold uppercase tracking-wider mb-1">{member.role}</p>
                                <h4 className="font-heading font-semibold text-slate">{member.name}</h4>
                                <p className="text-gray-400 text-xs mt-0.5">{member.designation}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Faculty Coordinators */}
                <div className="mb-12">
                    <h2 className="section-heading text-2xl mb-6">Faculty Coordinators</h2>
                    <div className="grid sm:grid-cols-3 gap-5">
                        {[
                            { name: 'Dr. J Dhayanithi', role: 'Associate Professor, Dept of CSE' },
                            { name: 'Dr. P Thiyagarajan', role: 'Associate Professor, Dept of CSE' },
                            { name: 'Mr. N. Basker', role: 'Assistant Professor, Dept of CSE' },
                        ].map((faculty) => (
                            <div key={faculty.name} className="card p-5">
                                <div className="w-10 h-10 rounded-full bg-saffron/10 flex items-center justify-center text-saffron-dark font-heading font-bold text-sm mb-3">
                                    {faculty.name.split(' ').pop()?.charAt(0)}
                                </div>
                                <h4 className="font-heading font-semibold text-slate text-sm">{faculty.name}</h4>
                                <p className="text-gray-400 text-xs mt-0.5">{faculty.role}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Hackathon Leads */}
                <div className="mb-12">
                    <h2 className="section-heading text-2xl mb-6">🎯 Hackathon Leads</h2>
                    <div className="grid sm:grid-cols-3 gap-5">
                        {[
                            { name: 'R Bhuvaneshwaran', dept: 'III CSD', phone: '7904627592' },
                            { name: 'S Bharath', dept: 'III CSD', phone: '9360491391' },
                            { name: 'S M Dineshkumar', dept: 'III CSD', phone: '6379853092' },
                        ].map((lead) => (
                            <div key={lead.name} className="card p-5">
                                <div className="w-12 h-12 rounded-full bg-royal/10 flex items-center justify-center text-royal font-heading font-bold text-lg mb-3">
                                    {lead.name.charAt(0)}
                                </div>
                                <h4 className="font-heading font-semibold text-slate mb-0.5">{lead.name}</h4>
                                <p className="text-gray-400 text-xs mb-3">{lead.dept}</p>
                                <div className="flex gap-2">
                                    <a
                                        href={`tel:+91${lead.phone}`}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-100 transition border border-green-200"
                                    >
                                        📞 Call
                                    </a>
                                    <a
                                        href={`sms:+91${lead.phone}`}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition border border-blue-200"
                                    >
                                        💬 Message
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Contact Us */}
                <div className="mb-12">
                    <h2 className="section-heading text-2xl mb-6">📧 Contact Us</h2>
                    <div className="card-static p-6">
                        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                            Have questions about the hackathon? Reach out to us through any of the following channels:
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <a
                                href="mailto:sonagameathon@gmail.com"
                                className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition border border-blue-100"
                            >
                                <div className="w-10 h-10 bg-royal rounded-lg flex items-center justify-center text-white text-lg">✉️</div>
                                <div>
                                    <p className="font-heading font-semibold text-slate text-sm">Email Us</p>
                                    <p className="text-blue-600 text-xs">sonapowerpredict@gmail.com</p>
                                </div>
                            </a>
                            <a
                                href="tel:+917904627592"
                                className="flex items-center gap-3 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition border border-green-100"
                            >
                                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white text-lg">📞</div>
                                <div>
                                    <p className="font-heading font-semibold text-slate text-sm">Call Us</p>
                                    <p className="text-green-600 text-xs">+91 7904627592 (R Bhuvaneshwaran)</p>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Sponsor */}
                <div className="mb-12">
                    <h2 className="section-heading text-2xl mb-6 text-center">Sponsor</h2>
                    <div className="card p-10 text-center max-w-md mx-auto">
                        <a href="https://zentropytech.com" target="_blank" rel="noopener noreferrer" className="inline-block hover:opacity-80 transition">
                            <img src="/zentropy-logo.png" alt="Zentropy Technologies" className="h-40 mx-auto object-contain mb-4" />
                        </a>
                        <p className="text-gray-500 text-sm">Zentropy Technologies — Data Science & Engineering Solutions</p>
                    </div>
                </div>

                {/* About Sona College of Technology */}
                <div className="mb-12">
                    <h2 className="section-heading text-2xl mb-4">About Sona College of Technology</h2>
                    <p className="text-gray-600 mb-5 leading-relaxed text-justify">
                        Sona College of Technology has achieved global identity through its involvement in research in recent technology and successful completion of projects and products. The college is known for its rich tradition and high values bestowed upon by its Founder Chairman, <strong>Thiru. M.S. Chockalingam</strong>. The college is awarded with <strong>"AICTE-CII Award for Best Industry-Linked Technical Institute in India consecutively for 6 years from 2014 to 2019"</strong> and acclaimed <strong>'A++' grade by 'NAAC'</strong> that stand testimony to the commitment of the college to impart quality education. Sona is a proud recipient of <strong>"Entrepreneur Award"</strong> from MHRD, New Delhi, for Emerging Global Destination for education. With <strong>36 advanced research centres</strong>, Sona College undertakes cutting-edge multidisciplinary research and has contributed to high-profile national missions such as <strong>Chandrayaan-3, Gaganyaan, and the Bahubali mission</strong>, underscoring its strong national impact and global outlook. Sona College of Technology is equipped with world class infrastructure, highly qualified and experienced faculty members, and an active Placement Training and Welfare Cell.
                    </p>
                </div>

                {/* About the CSE Department */}
                <div className="mb-12">
                    <h2 className="section-heading text-2xl mb-4">About the CSE Department</h2>
                    <p className="text-gray-600 mb-5 leading-relaxed text-justify">
                        The Department of Computer Science and Engineering (CSE) at Sona College of Technology is committed to excellence in education, research, and innovation. Accredited by the <strong>National Board of Accreditation (NBA) for six years</strong>, the department offers <strong>five undergraduate programs and one postgraduate program</strong>, providing students with a strong foundation in core computing concepts and emerging technologies. Supported by experienced faculty, modern laboratories, and active industry and research engagement, the department fosters skill development, academic excellence, and global competitiveness, while encouraging innovation and practical learning.
                    </p>
                </div>

                {/* Vision Quote */}
                <div className="card-static bg-sky/30 p-6">
                    <p className="font-heading font-bold text-slate mb-1">Where Cricket Meets Code 🏏</p>
                    <p className="text-gray-600 italic leading-relaxed">
                        "To create a platform where code dictates the play, and algorithms predict the champions."
                    </p>
                    <p className="text-gray-400 text-sm mt-2">— Department of Computer Science & Engineering, Sona College of Technology</p>
                </div>
            </div>
        </div>
    );
};

export default About;
