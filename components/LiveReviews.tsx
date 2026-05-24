'use client';

import React, { useState, useEffect } from 'react';
import { Star, MessageCircle, User, Briefcase, ChevronDown } from 'lucide-react';

interface Review {
  id: string;
  name: string;
  role: string;
  review: string;
  rating: number;
  createdAt: string;
}

interface LiveReviewsProps {
  className?: string;
}

const LiveReviews: React.FC<LiveReviewsProps> = ({ className = '' }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Fetch reviews
  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reviews');
      const data = await response.json();
      
      if (data.success) {
        setReviews(data.reviews);
      } else {
        setError('Failed to load reviews');
      }
    } catch (err) {
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // Render star rating
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('so-SO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-mediumGray dark:text-gray-400">Waa la soo rabaa reviews-ka...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-redError mb-4">{error}</p>
        <button
          onClick={fetchReviews}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Reviews Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h4 className="text-lg sm:text-xl font-semibold text-darkGray dark:text-gray-100 mb-2">
            Reviews-ka Macaamiisha ({reviews.length})
          </h4>
          <p className="text-mediumGray dark:text-gray-400">
            Halkan waxaad aragtaa reviews-ka macaamiisha Revlo
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm font-semibold"
        >
          {showForm ? 'Dhaaf' : 'Ka Dhiib Review'}
        </button>
      </div>

      {/* Review Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg border border-lightGray dark:border-gray-700 mb-6">
          <ReviewForm onSuccess={() => {
            setShowForm(false);
            fetchReviews();
          }} />
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="bg-lightGray dark:bg-gray-800 p-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-center">
          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-mediumGray dark:text-gray-400 mb-4">
            Ma jiraan reviews-ka cusub. Ka dhiib review-kaaga si aad u noqoto kan ugu horeeya!
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Ka Dhiib Review-kaaga
          </button>
        </div>
      ) : (
        <div>
          {/* Top 3 Reviews Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-lg font-semibold text-darkGray dark:text-gray-100 flex items-center">
                <Star className="w-5 h-5 text-yellow-400 fill-current mr-2" />
                Sadexda Review-ka Ugu Fiican
              </h5>
              <div className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full text-sm font-medium">
                ⭐ 5-Star Reviews
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {reviews
                .filter(review => review.rating === 5)
                .slice(0, 3)
                .map((review, index) => (
                  <div
                    key={review.id}
                    className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 p-4 sm:p-6 rounded-xl shadow-lg border-2 border-yellow-200 dark:border-yellow-800/30 animate-fade-in-up relative"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Top Review Badge */}
                    <div className="absolute -top-2 -right-2 bg-yellow-400 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                      #{index + 1}
                    </div>
                    
                    {/* Review Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                          <h6 className="font-semibold text-darkGray dark:text-gray-100">
                            {review.name}
                          </h6>
                          <div className="flex items-center space-x-2">
                            <Briefcase className="w-3 h-3 text-mediumGray dark:text-gray-400" />
                            <p className="text-sm text-mediumGray dark:text-gray-400">
                              {review.role}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1 mb-1">
                          {renderStars(review.rating)}
                        </div>
                        <p className="text-xs text-mediumGray dark:text-gray-400">
                          {formatDate(review.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Review Content */}
                    <p className="text-mediumGray dark:text-gray-300 leading-relaxed text-sm">
                      "{review.review}"
                    </p>
                  </div>
                ))}
            </div>
          </div>

          {/* All Reviews Section (Collapsible) */}
          {reviews.length > 3 && (
            <div>
              <button
                onClick={() => setShowAllReviews(!showAllReviews)}
                className="flex items-center justify-center w-full py-3 px-4 bg-lightGray dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 mb-4"
              >
                <span className="text-darkGray dark:text-gray-100 font-medium mr-2">
                  {showAllReviews ? 'Qari Dhammaan Reviews-ka' : `Arag Dhammaan Reviews-ka (${reviews.length})`}
                </span>
                <ChevronDown className={`w-4 h-4 text-darkGray dark:text-gray-100 transition-transform duration-200 ${showAllReviews ? 'rotate-180' : ''}`} />
              </button>

              {showAllReviews && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 animate-fade-in-up">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg border border-lightGray dark:border-gray-700"
                    >
                      {/* Review Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h5 className="font-semibold text-darkGray dark:text-gray-100">
                              {review.name}
                            </h5>
                            <div className="flex items-center space-x-2">
                              <Briefcase className="w-3 h-3 text-mediumGray dark:text-gray-400" />
                              <p className="text-sm text-mediumGray dark:text-gray-400">
                                {review.role}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1 mb-1">
                            {renderStars(review.rating)}
                          </div>
                          <p className="text-xs text-mediumGray dark:text-gray-400">
                            {formatDate(review.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Review Content */}
                      <p className="text-mediumGray dark:text-gray-300 leading-relaxed">
                        "{review.review}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Review Form Component
const ReviewForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    review: '',
    rating: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setFormData({ name: '', role: '', review: '', rating: '' });
        onSuccess();
      } else {
        setError(data.error || 'Failed to submit review');
      }
    } catch (err) {
      setError('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h5 className="text-lg font-semibold text-darkGray dark:text-gray-100 mb-4">
        Ka Dhiib Review-kaaga
      </h5>
      
      {error && (
        <div className="bg-redError/10 border border-redError/20 text-redError px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-darkGray dark:text-gray-200 mb-2">
            Magacaaga *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-darkGray dark:text-gray-100"
            placeholder="Geli magacaaga"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-darkGray dark:text-gray-200 mb-2">
            Jagadaada *
          </label>
          <input
            type="text"
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-darkGray dark:text-gray-100"
            placeholder="Geli jagadaada"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-darkGray dark:text-gray-200 mb-2">
          Qiimaha (1-5) *
        </label>
        <select
          name="rating"
          value={formData.rating}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-darkGray dark:text-gray-100"
        >
          <option value="">Dooro qiimaha</option>
          <option value="5">5 - Aad u wanaagsan</option>
          <option value="4">4 - Wanaagsan</option>
          <option value="3">3 - Caadi</option>
          <option value="2">2 - Xun</option>
          <option value="1">1 - Aad u xun</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-darkGray dark:text-gray-200 mb-2">
          Review-kaaga *
        </label>
        <textarea
          name="review"
          value={formData.review}
          onChange={handleChange}
          required
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-darkGray dark:text-gray-100"
          placeholder="Ka dhiib review-kaaga Revlo..."
        />
      </div>

      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-primary text-white py-2 px-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Waa la dirinayaa...' : 'Dir Review-ka'}
        </button>
        <button
          type="button"
          onClick={() => setFormData({ name: '', role: '', review: '', rating: '' })}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-darkGray dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Dhaaf
        </button>
      </div>
    </form>
  );
};

export default LiveReviews;
