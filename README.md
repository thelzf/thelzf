<div align="center" style="font-family: Arial, sans-serif; line-height: 1.5;">

  <!-- Avatar animado -->
  <div style="display: inline-block; margin-bottom: 10px;">
    <img src="https://i.imgur.com/your-avatar.gif" alt="Luiz Felipe" width="120" style="border-radius: 50%; animation: rotateHead 3s infinite alternate;">
  </div>

  <!-- Nome e profissão -->
  <h2 style="margin: 5px 0;">Luiz Felipe</h2>
  <p style="margin: 0; font-weight: 500; color: #555;">Full Stack Developer</p>

  <!-- Skills -->
  <div style="margin-top: 15px; display: flex; justify-content: center; gap: 40px;">

    <!-- Backend -->
    <div style="text-align: center;">
      <p style="margin: 0; font-weight: bold;">Backend</p>
      <div class="stars">
        <span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span>
      </div>
    </div>

    <!-- Frontend -->
    <div style="text-align: center;">
      <p style="margin: 0; font-weight: bold;">Frontend</p>
      <div class="stars">
        <span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span>
      </div>
    </div>

  </div>
</div>

<!-- CSS animado -->
<style>
  @keyframes rotateHead {
    0% { transform: rotate(0deg); }
    50% { transform: rotate(10deg); }
    100% { transform: rotate(0deg); }
  }

  .stars span {
    display: inline-block;
    font-size: 20px;
    opacity: 0.3;
    animation: shine 1s infinite;
    animation-fill-mode: forwards;
  }

  .stars span:nth-child(1) { animation-delay: 0s; }
  .stars span:nth-child(2) { animation-delay: 0.2s; }
  .stars span:nth-child(3) { animation-delay: 0.4s; }
  .stars span:nth-child(4) { animation-delay: 0.6s; }
  .stars span:nth-child(5) { animation-delay: 0.8s; }

  @keyframes shine {
    0%, 50%, 100% { opacity: 0.3; }
    25% { opacity: 1; }
  }
</style>
